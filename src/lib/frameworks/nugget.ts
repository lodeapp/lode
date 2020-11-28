import { debounce, find, flatten, isArray, pickBy } from 'lodash'
import { ProjectEventEmitter } from '@lib/frameworks/emitter'
import { IFramework } from '@lib/frameworks/framework'
import { ISuiteResult } from '@lib/frameworks/suite'
import { ITest, ITestResult } from '@lib/frameworks/test'
import { Status, parseStatus } from '@lib/frameworks/status'

/**
 * Nuggets are the testable elements inside a repository
 * (i.e. either a suite or a test).
 */
export abstract class Nugget extends ProjectEventEmitter {
    public tests: Array<ITest> = []
    public selected: boolean = false
    public expanded: boolean = false
    public partial: boolean = false

    protected framework: IFramework
    protected result?: any
    protected fresh: boolean = false
    protected bloomed: boolean = false

    protected updateCountsListener: (nugget: Nugget, toggle: boolean) => Promise<void>

    constructor (framework: IFramework) {
        super(framework.getApplicationWindow())
        this.framework = framework
        this.updateCountsListener = debounce(this.updateSelectedCounts.bind(this), 50)
    }

    /**
     * Get the nugget's id.
     */
    public abstract getId (): string

    /**
     * Prepares the test for sending out to renderer process.
     *
     * @param status Which status to recursively set on tests. False will persist current status.
     */
    public abstract render (status?: Status | false): ISuiteResult | ITestResult;

    /**
     * Instantiate a new test.
     *
     * @param result The test result with which to instantiate a new test.
     */
    protected abstract newTest (result: ITestResult): ITest

    /**
     * Get this nugget's tests' results, if any.
     */
    public getTestResults (): Array<ITestResult> {
        return this.result.tests || []
    }

    /**
     * Count this nugget's children.
     */
    public countChildren (): number {
        return this.bloomed
            ? this.tests.length
            : this.getTestResults().length
    }

    /**
     * Whether this nugget has children.
     */
    public hasChildren (): boolean {
        return this.countChildren() > 0
    }

    /**
     * Returns a given test result object to default values.
     *
     * @param result The result object that will be persisted.
     * @param status Which status to recursively set on tests. False will persist current status.
     */
    protected defaults (result: ITestResult, status: Status | false = 'idle'): ITestResult {
        return (pickBy({
            id: result.id,
            name: result.name,
            displayName: result.displayName !== result.name ? result.displayName : null,
            status: status ? status : result.status,
            // @TODO: Offload to separate store
            feedback: result.feedback,
            console: result.console,
            params: result.params,
            stats: result.stats,
            // ...
            tests: (result.tests || []).map((test: ITestResult) => this.defaults(test, status))
        }, property => {
            return isArray(property) ? property.length : !!property
        }) as any)
    }

    /**
     * Find the test by a given identifier in the nugget's current children.
     *
     * @param id The identifier of the test to try to find.
     */
    public findTest (id: string): ITest | undefined {
        return find(this.tests, test => test.getId() === id)
    }

    /**
     * Factory function for creating a new child test.
     *
     * @param result The test result with which to instantiate a new test.
     * @param force Whether to bypass looking for the test in the nugget's current children.
     */
    protected makeTest (
        result: ITestResult,
        force: boolean = false
    ): ITest {
        let test: ITest | undefined | boolean = force ? false : this.findTest(result.id)
        if (!test) {
            test = this.newTest(result)
            test.on('selected', this.updateCountsListener)
            // If nugget is selected, newly created test should be, too.
            test.selected = this.selected
            this.tests.push(test)
        }
        return test
    }

    /**
     * Trigger an update of this nugget's selected count.
     */
    protected async updateSelectedCounts (nugget: Nugget, toggle: boolean): Promise<void> {
        const total = this.tests.length
        const selectedChildren = this.tests.filter(test => test.selected).length
        const partial = selectedChildren > 0 && total > 0 && total > selectedChildren

        // Update partial status
        if (this.partial !== partial) {
            this.partial = partial
            this.emit('selective', this)
            this.emitToRenderer(`${this.getId()}:selective`, this.render())
        }

        // Update whether this nugget should be selected or not, based on children
        if (selectedChildren && !this.selected) {
            this.toggleSelected(true, false)
        } else if (!selectedChildren && this.selected) {
            this.toggleSelected(false, false)
        }
    }

    /**
     * Debrief the tests inside this nugget.
     *
     * @param tests An array of test results.
     * @param cleanup Whether to clean obsolete tests after debriefing. Can be overridden by the method's logic.
     */
    protected debriefTests (tests: Array<ITestResult>, cleanup: boolean) {
        return new Promise((resolve, reject) => {

            // Attempt to find out if this is the last test to run.
            //
            // 1) isLast === -1 : No `isLast` key is found on result object,
            //    which means the framework producing the results does not
            //    support debriefing state.
            //
            // 2) isLast === 0 : Framework supports debriefing state, but
            //    the result object is stating this is not the last test.
            //
            // 3) isLast > 0 : Framework supports debriefing state and
            //    result object is stating this is the last test.
            //
            const isLast = tests
                .map(test => typeof test.isLast === 'undefined' ? -1 : Number(test.isLast))
                .reduce((accumulator, value) => accumulator + value, 0)

            // If test is marked as last, force cleanup.
            if (isLast >= 1) {
                cleanup = true
            }

            // If test is not marked as last, but `isLast` property was found
            // on the test, override cleanup value.
            if (isLast === 0) {
                cleanup = false
            }

            Promise.all(tests.map((result: ITestResult) => {
                return this.makeTest(result).debrief(result, cleanup)
            })).then(() => {
                this.afterDebrief(cleanup).then(() => {
                    resolve()
                })
            })
        })
    }

    /**
     * A function that runs after debriefing this nugget.
     *
     * @param cleanup Whether we should clean-up idle children (i.e. obsolete)
     */
    protected async afterDebrief (cleanup: boolean): Promise<void> {
        if (cleanup) {
            this.cleanTestsByStatus('queued')
            if (!this.expanded) {
                await this.wither()
            }
        }
        this.updateStatus()
        if (this.expanded) {
            this.emitTestsToRenderer()
        }
    }

    /**
     * Clean currently loaded tests by a given status.
     *
     * @param status The status by which to clean the tests.
     */
    protected cleanTestsByStatus (status: Status): void {
        this.tests = this.tests.filter(test => {
            return test.getStatus() !== status
        })
    }

    /**
     * Get the status from a result object recursively. Useful to defer status
     * calculations from reporters to the app's logic (e.g. Jest), when a
     * chain of statuses cannot be reliably calculated in the reporter itself.
     *
     * @param result The test result we're extracting the status from
     */
    protected getRecursiveStatus (result: ITestResult): Status {
        if (!result.status) {
            result.status = parseStatus((result.tests || []).map((test: ITestResult) => this.getRecursiveStatus(test)))
        }
        return result.status
    }

    /**
     * Update this nugget's status.
     *
     * @param to The status we're updating to.
     */
    protected updateStatus (to?: Status): void {
        if (typeof to === 'undefined') {
            const statuses = this.bloomed
                ? this.tests.map((test: ITest) => test.getStatus())
                : this.getTestResults().map((test: ITestResult) => this.framework.getNuggetStatus(test.id))
            to = parseStatus(statuses)
        }
        const from = this.getStatus()
        if (to !== from) {
            this.framework.setNuggetStatus(this.getId(), to, from, false)
        }
    }

    /**
     * Get this nugget's status.
     */
    public getStatus (): Status {
        return this.framework.getNuggetStatus(this.getId())
    }

    /**
     * Whether the nugget can run tests selectively.
     */
    public canToggleTests (): boolean {
        return false
    }

    /**
     * Toggle this nugget's selected state.
     *
     * @param toggle Whether it should be toggled on or off. Leave blank for inverting toggle.
     * @param cascade Whether toggling should apply to nugget's children.
     */
    public async toggleSelected (toggle?: boolean, cascade?: boolean): Promise<void> {
        this.selected = typeof toggle === 'undefined' ? !this.selected : toggle

        // Selected nuggets should always bloom its tests.
        if (this.selected) {
            await this.bloom()
        } else if (!this.expanded) {
            await this.wither()
        }

        if (this.canToggleTests() && cascade !== false) {
            this.tests.forEach(test => {
                test.toggleSelected(this.selected, true)
            })
        }

        this.emit('selected', this, toggle)
        this.emitToRenderer(`${this.getId()}:selected`, this.render(), toggle)
    }

    /**
     * Toggle this nugget's expanded state.
     *
     * @param toggle Whether it should be expanded or collapsed. Leave blank for inverting toggle.
     * @param cascade Whether toggling should apply to nugget's children.
     */
    public async toggleExpanded (toggle?: boolean, cascade?: boolean): Promise<void> {
        this.expanded = typeof toggle === 'undefined' ? !this.expanded : toggle

        if (this.expanded) {
            await this.bloom()
        } else {
            await this.wither()
        }

        if (cascade !== false) {
            this.tests.forEach(test => {
                test.toggleExpanded(this.expanded)
            })
        }
    }

    /**
     * Make the test objects nested to this nugget.
     */
    protected async bloom (): Promise<void> {
        if (this.bloomed) {
            return
        }
        return new Promise((resolve, reject) => {
            this.tests = this.getTestResults().map((result: ITestResult) => {
                return this.makeTest(result, true)
            })
            this.bloomed = true
            resolve()
        })
    }

    /**
     * Destroy the test objects nested to this nugget, leaving only the static
     * JSON structure with which to build them again.
     */
    protected async wither (): Promise<void> {
        if (!this.bloomed) {
            return
        }
        // Never wither a selected nugget.
        if (this.selected) {
            return
        }
        this.result.tests = this.tests.map((test: ITest) => test.persist(false))
        this.tests = []
        this.bloomed = false
    }

    /**
     * Set the freshness state of a nugget.
     *
     * @param fresh The freshness state to set.
     */
    public setFresh (fresh: boolean): void {
        this.fresh = fresh
    }

    /**
     * Get the freshness state of a nugget.
     */
    public isFresh (): boolean {
        return this.fresh
    }

    /**
     * Send all tests to renderer process.
     */
    public async emitTestsToRenderer (): Promise<void> {
        if (!this.bloomed) {
            await this.bloom()
        }

        this.emitToRenderer(
            `${this.getId()}:framework-tests`,
            this.tests.map((test: ITest) => test.render(false))
        )
    }

    /**
     * Get the ids of this nuggets and its children.
     */
    protected getRecursiveNuggetIds (result: ITestResult): Array<string> {
        return flatten([
            result.id,
            ...(result.tests || []).map((test: ITestResult) => {
                return this.getRecursiveNuggetIds(test)
            })
        ])
    }

    /**
     * A chance for nuggets to append items to the context menus of
     * their representation in the renderer.
     */
    public contextMenu (): Array<Electron.MenuItemConstructorOptions> {
        return []
    }
}
