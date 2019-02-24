import { debounce, find } from 'lodash'
import { EventEmitter } from 'events'
import { ITest, ITestResult } from '@main/lib/frameworks/test'
import { Status, parseStatus } from '@main/lib/frameworks/status'

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
    public canToggleTests: boolean = false
    public updateCountsListener: any

    protected fresh: boolean = false

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
     * Find the test by a given identifier in the nugget's current children.
     *
     * @param identifier The identifier of the test to try to find.
     */
    protected findTest (identifier: string): ITest | undefined {
        return find(this.tests, { identifier })
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
        let test: ITest | undefined | boolean = force ? false : this.findTest(result.identifier)
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
     * Load the nugget's tests from an array of results.
     *
     * @param results The array of results from which to load tests.
     */
    protected loadTests (results: Array<ITestResult>): void {
        this.tests = results.map((result: ITestResult) => {
            return this.makeTest(result, true)
        })
    }

    /**
     * Debrief the tests inside this nugget.
     *
     * @param tests An array of test results.
     * @param cleanup Whether to clean obsolete tests after debriefing. Can be overridden by the method's logic.
     */
    protected debriefTests (tests: Array<ITestResult>, cleanup: boolean) {
        return new Promise((resolve, reject) => {
            const running: Array<Promise<void>> = []

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

            tests.forEach((result: ITestResult) => {
                running.push(this.makeTest(result).debrief(result, cleanup))
            })

            Promise.all(running).then(() => {
                this.afterDebrief(cleanup, isLast)
                resolve()
            })
        })
    }

    /**
     * A function that runs after debriefing this nugget.
     *
     * @param cleanup Whether we should clean-up idle children (i.e. obsolete)
     * @param isLast Last child indicator. See @debriefTests
     */
    protected afterDebrief (cleanup: boolean, isLast: number): void {
        if (cleanup) {
            this.cleanTestsByStatus('queued')
        }
        this.updateStatus()
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
     * Update this nugget's status.
     *
     * @param to The status we're updating to.
     */
    protected updateStatus (to?: Status): void {
        if (typeof to === 'undefined') {
            to = parseStatus(this.tests.map(test => test.getStatus()))
        }
        const from = this.getStatus()
        this.status = to
        this.emit('status', to, from)
    }

    /**
     * Get this nugget's status.
     */
    public getStatus (): Status {
        return this.status
    }

    /**
     * Toggle this nugget's selected state.
     *
     * @param toggle Whether it should be toggled on or off. Leave blank for inverting toggle.
     * @param cascade Whether toggling should apply to nugget's children.
     */
    public toggleSelected (toggle?: boolean, cascade?: boolean): void {
        this.selected = typeof toggle === 'undefined' ? !this.selected : toggle
        this.emit('selective', this)
        if (this.canToggleTests && cascade !== false) {
            this.tests.forEach(test => {
                test.toggleSelected(this.selected)
            })
        }
    }

    /**
     * Toggle this nugget's expanded state.
     *
     * @param toggle Whether it should be expanded or collapsed. Leave blank for inverting toggle.
     * @param cascade Whether toggling should apply to nugget's children.
     */
    public toggleExpanded (toggle?: boolean, cascade?: boolean): void {
        const expanded = typeof toggle === 'undefined' ? !this.expanded : toggle
        if (cascade !== false) {
            this.tests.forEach(test => {
                test.toggleExpanded(expanded)
            })
        }
        this.expanded = expanded
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
     * Reset this nugget to its initial state.
     *
     * @param selective Whether we're currently in selective mode or not.
     */
    public reset (selective: boolean): void {
        this.setFresh(false)
        this.updateStatus('idle')
        this.tests.filter(test => selective && this.canToggleTests ? test.selected : true)
            .forEach(test => {
                test.resetResult()
                test.reset(selective)
            })
    }

    /**
     * Mark this nugget as queued for running.
     *
     * @param selective Whether we're currently in selective mode or not.
     */
    public queue (selective: boolean): void {
        this.setFresh(false)
        this.updateStatus('queued')
        this.tests.filter(test => selective && this.canToggleTests ? test.selected : true)
            .forEach(test => {
                test.resetResult()
                test.queue(selective)
            })
    }

    /**
     * Mark this nugget as having an error.
     *
     * @param selective Whether we're currently in selective mode or not.
     */
    public error (selective: boolean): void {
        this.setFresh(false)
        this.updateStatus('error')
        this.tests.filter(test => selective && this.canToggleTests ? test.selected : true)
            .forEach(test => {
                test.resetResult()
                test.error(selective)
            })
    }

    /**
     * Reset this nugget or any of its children if they are
     * on a queued status.
     */
    public resetQueued (): void {
        if (this.getStatus() === 'queued') {
            this.reset(false)
            return
        } else if (this.getStatus() === 'running') {
            this.tests.forEach(test => {
                test.resetQueued()
            })
            this.updateStatus()
        }
    }

    /**
     * A chance for nuggets to append items to the context menus of
     * their representation in the renderer.
     */
    public contextMenu (): Array<Electron.MenuItemConstructorOptions> {
        return []
    }
}
