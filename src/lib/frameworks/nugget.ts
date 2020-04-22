import { debounce, find, get, isArray, max, maxBy, pickBy, sum } from 'lodash'
import { EventEmitter } from 'events'
import { ITest, ITestResult } from '@lib/frameworks/test'
import { Status, parseStatus } from '@lib/frameworks/status'

/**
 * Nuggets are the testable elements inside a repository
 * (i.e. either a suite or a test).
 */
export abstract class Nugget extends EventEmitter {
    protected status: Status = 'idle'
    public tests: Array<ITest> = []
    public selected: boolean = false
    public expanded: boolean = false
    public partial: boolean = false
    public updateCountsListener: any
    public result?: any

    protected fresh: boolean = false
    protected bloomed: boolean = false
    protected active: boolean = false

    constructor () {
        super()
        this.updateCountsListener = debounce(this.updateSelectedCounts.bind(this), 100)
    }

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
        return this.getTestResults().length
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
     * @param status Which status to recursively set. False will persist current status.
     */
    protected defaults (result: ITestResult, status: Status | false = 'idle'): ITestResult {
        return (pickBy({
            id: result.id,
            name: result.name,
            displayName: result.displayName !== result.name ? result.displayName : null,
            status: status ? status : result.status,
            feedback: result.feedback,
            console: result.console,
            params: result.params,
            stats: result.stats,
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
    protected findTest (id: string): ITest | undefined {
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
            test.on('selective', this.updateCountsListener)
            // If nugget is selected, newly created test should be, too.
            test.selected = this.selected
            this.tests.push(test)
        }
        return test
    }

    /**
     * Trigger an update of this nugget's selected count.
     */
    protected updateSelectedCounts (): void {
        const total = this.tests.length
        const filtered = this.tests.filter(test => test.selected).length
        if (filtered && !this.selected) {
            this.toggleSelected(true, false)
        } else if (!filtered && this.selected) {
            this.toggleSelected(false, false)
        }
        this.partial = filtered > 0 && total > 0 && total > filtered
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
        return Promise.resolve()
    }

    /**
     * Clean currently loaded tests by a given status.
     *
     * @param status The status by which to clean the tests.
     */
    protected cleanTestsByStatus (status: Status): void {
        this.tests = this.tests.filter(test => {
            return test.status !== status
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
                : this.getTestResults().map((test: ITestResult) => test.status)
            to = parseStatus(statuses)
        }
        const from = this.getStatus()
        this.status = to

        // Update the status on the result object, too, if applicable.
        if (this.result && this.result.status) {
            this.result.status = to
        }

        this.emit('status', to, from)
    }

    /**
     * Get this nugget's status.
     */
    public getStatus (): Status {
        return this.status
    }

    /**
     * Get this nugget's last updated date as a string.
     */
    public getLastUpdated (): string | null {
        if (this.hasChildren()) {
            const dates = this.bloomed
                ? this.tests.map((test: ITest) => test.getLastUpdated())
                : this.getTestResults().map((test: ITestResult) => get(test, 'stats.first', null))
            return maxBy(dates, date => {
                return date ? Date.parse(date).valueOf() : null
            })
        }

        // If no children exist, just return this nugget's own information.
        return get(this.result, 'stats.first', null)
    }

    /**
     * Get this nugget's last run date as a string.
     */
    public getLastRun (): string | null {
        if (this.hasChildren()) {
            const dates = this.bloomed
                ? this.tests.map((test: ITest) => test.getLastRun())
                : this.getTestResults().map((test: ITestResult) => get(test, 'stats.last', null))
            return maxBy(dates, date => {
                return date ? Date.parse(date).valueOf() : null
            })
        }

        // If no children exist, just return this nugget's own information.
        return get(this.result, 'stats.last', null)
    }

    /**
     * Get this nugget's maximum duration in milliseconds.
     */
    public getTotalDuration (): number {
        if (this.hasChildren()) {
            const durations = this.bloomed
                ? this.tests.map((test: ITest) => test.getMaxDuration())
                : this.getTestResults().map((test: ITestResult) => get(test, 'stats.duration', 0))
            return sum(durations) || 0
        }

        // If no children exist, just return this nugget's own information.
        return get(this.result, 'stats.duration', 0)
    }

    /**
     * Get this nugget's maximum duration in milliseconds.
     */
    public getMaxDuration (): number {
        if (this.hasChildren()) {
            const durations = this.bloomed
                ? this.tests.map((test: ITest) => test.getMaxDuration())
                : this.getTestResults().map((test: ITestResult) => get(test, 'stats.duration', 0))
            return max(durations) || 0
        }

        // If no children exist, just return this nugget's own information.
        return get(this.result, 'stats.duration', 0)
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

        this.emit('selective', this)
        if (this.canToggleTests() && cascade !== false) {
            this.tests.forEach(test => {
                test.toggleSelected(this.selected)
            })
        }
        return Promise.resolve()
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
        return Promise.resolve()
    }

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

    protected async wither (): Promise<void> {
        // Never wither a selected nugget or a nugget with an active test inside.
        if (this.selected || this.tests.some((test: ITest) => test.isActive())) {
            return
        }
        this.result.tests = this.tests.map((test: ITest) => test.persist(false))
        this.tests = []
        this.bloomed = false
        return Promise.resolve()
    }

    /**
     * Set the active state of a nugget.
     *
     * @param active The active state to set.
     */
    public setActive (active: boolean): void {
        this.active = active
    }

    /**
     * Get the active state of a nugget.
     */
    public isActive (): boolean {
        return this.active
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
     * Mark this nugget as idle.
     *
     * @param selective Whether we're currently in selective mode or not.
     */
    public idle (selective: boolean): void {
        this.setFresh(false)
        this.updateStatus('idle')
        this.tests
            .filter(test => selective && this.canToggleTests() ? test.selected : true)
            .forEach(test => {
                test.resetResult()
                test.idle(selective)
            })

        if (!this.bloomed) {
            // If not bloomed, then granular selecting is not possible, so we
            // can go ahead and update all the nugget's children's status.
            this.result!.tests = this.getTestResults().map((test: ITestResult) => {
                return this.defaults(test, 'idle')
            })
        }
    }

    /**
     * Mark this nugget as queued for running.
     *
     * @param selective Whether we're currently in selective mode or not.
     */
    public queue (selective: boolean): void {
        this.setFresh(false)
        this.updateStatus('queued')
        this.tests
            .filter(test => selective && this.canToggleTests() ? test.selected : true)
            .forEach(test => {
                test.resetResult()
                test.queue(selective)
            })

        if (!this.bloomed) {
            // If not bloomed, then granular selecting is not possible, so we
            // can go ahead and update all the nugget's children's status.
            this.result!.tests = this.getTestResults().map((test: ITestResult) => {
                return this.defaults(test, 'queued')
            })
        }
    }

    /**
     * Mark this nugget as having an error.
     *
     * @param selective Whether we're currently in selective mode or not.
     */
    public error (selective: boolean): void {
        this.setFresh(false)
        this.updateStatus('error')
        this.tests
            .filter(test => selective && this.canToggleTests() ? test.selected : true)
            .forEach(test => {
                test.resetResult()
                test.error(selective)
            })

        if (!this.bloomed) {
            // If not bloomed, then granular selecting is not possible, so we
            // can go ahead and update all the nugget's children's status.
            this.result!.tests = this.getTestResults().map((test: ITestResult) => {
                return this.defaults(test, 'error')
            })
        }
    }

    /**
     * Set the status of this nugget or any of its children if
     * they are on a queued status (i.e. from an interrupted run).
     *
     * @param status The status to set the nugget and children to.
     * @param selective Whether we're currently in selective mode or not.
     */
    protected setQueuedStatus (status: 'idle' | 'error', selective: boolean): void {
        if (['queued', 'running'].indexOf(this.getStatus()) > -1) {
            this.tests.forEach(test => {
                if (['queued', 'running'].indexOf(test.getStatus()) > -1) {
                    test[status](selective)
                }
            })
            this.result!.tests = this.getTestResults().map((test: ITestResult) => {
                // Static results can never be "running", so check for "queued" only.
                if (test.status === 'queued') {
                    return this.defaults(test, status)
                }
                return test
            })
            this.updateStatus()
        }
    }

    /**
     * Reset this nugget or any of its children if they are
     * on a queued status (i.e. from an interrupted run).
     *
     * @param selective Whether we're currently in selective mode or not.
     */
    public idleQueued (selective: boolean): void {
        this.setQueuedStatus('idle', selective)
    }

    /**
     * Mark this nugget or any of its children if they are on a queued status
     * as having errored out (i.e. if they were expected to run and didn't)
     *
     * @param selective Whether we're currently in selective mode or not.
     */
    public errorQueued (selective: boolean): void {
        this.setQueuedStatus('error', selective)
    }

    /**
     * A chance for nuggets to append items to the context menus of
     * their representation in the renderer.
     */
    public contextMenu (): Array<Electron.MenuItemConstructorOptions> {
        return []
    }
}
