import { debounce, find } from 'lodash'
import { EventEmitter } from 'events'
import { ITest, ITestResult } from '@lib/frameworks/test'
import { Status, parseStatus } from '@lib/frameworks/status'

export abstract class Container extends EventEmitter {
    public tests: Array<ITest> = []
    public status: Status = 'idle'
    public selected: boolean = false
    public partial: boolean = false
    public canToggleTests: boolean = false
    public fresh: boolean = false
    public updateCountsListener: any

    constructor () {
        super()
        this.updateCountsListener = debounce(this.updateSelectedCounts.bind(this), 100)
    }

    /**
     * Instantiate a new test.
     *
     * @param result The test result with which to instantiate a new test.
     */
    abstract newTest (result: ITestResult): ITest

    /**
     * Toggle this container's selected state.
     *
     * @param toggle Whether it should be toggled on or off. Leave blank for inverting toggle.
     * @param cascade Whether toggling should apply to container's children.
     */
    toggleSelected (toggle?: boolean, cascade?: boolean): void {
        this.selected = typeof toggle === 'undefined' ? !this.selected : toggle
        this.emit('selective', this)
        if (this.canToggleTests && cascade !== false) {
            this.tests.forEach(test => {
                test.toggleSelected(this.selected)
            })
        }
    }

    /**
     * Find the test by a given name in the container's current children.
     *
     * @param name The name of the test to try to find.
     */
    findTest (name: string): ITest | undefined {
        return find(this.tests, { name })
    }

    /**
     * Factory function for creating a new child test.
     *
     * @param result The test result with which to instantiate a new test.
     * @param force Whether to bypass looking for the test in the container's current children.
     */
    makeTest (
        result: ITestResult,
        force: boolean = false
    ): ITest {
        let test: ITest | undefined | boolean = force ? false : this.findTest(result.name)
        if (!test) {
            test = this.newTest(result)
            test.on('selective', this.updateCountsListener)
            // If container is selected, newly created test should be, too.
            test.selected = this.selected
            this.tests.push(test)
        }
        return test
    }

    /**
     * Trigger an update of this container's selected count.
     */
    updateSelectedCounts (): void {
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
     * Debrief the tests inside this container.
     *
     * @param tests An array of test results.
     * @param cleanup Whether to clean obsolete tests after debriefing. Can be overridden by the method's logic.
     */
    debriefTests (tests: Array<ITestResult>, cleanup: boolean) {
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
                let test: ITest = this.makeTest(result)
                running.push(test.debrief(result, cleanup))
            })

            Promise.all(running).then(() => {
                this.afterDebrief(cleanup, isLast)
                resolve()
            })
        })
    }

    /**
     * A function that runs after debriefing this container.
     *
     * @param cleanup Whether we should clean-up idle children (i.e. obsolete)
     * @param isLast Last child indicator. See @debriefTests
     */
    afterDebrief (cleanup: boolean, isLast: number): void {
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
    cleanTestsByStatus (status: Status): void {
        this.tests = this.tests.filter(test => {
            return test.status !== status
        })
    }

    /**
     * Update this container's status.
     *
     * @param to The status we're updating to.
     */
    updateStatus (to?: Status): void {
        if (typeof to === 'undefined') {
            to = parseStatus(this.tests.map(test => test.status))
        }
        const from = this.status
        this.status = to
        this.emit('status', to, from)
    }

    /**
     * Reset this container to its initial state.
     *
     * @param selective Whether we're currently in selective mode or not.
     */
    reset (selective: boolean): void {
        this.fresh = false
        this.updateStatus('idle')
        this.tests.filter(test => selective && this.canToggleTests ? test.selected : true)
            .forEach(test => {
                test.reset(selective)
            })
    }

    /**
     * Mark this container as queued for running.
     *
     * @param selective Whether we're currently in selective mode or not.
     */
    queue (selective: boolean): void {
        this.fresh = false
        this.updateStatus('queued')
        this.tests.filter(test => selective && this.canToggleTests ? test.selected : true)
            .forEach(test => {
                test.queue(selective)
            })
    }

    /**
     * Reset this container or any of its children if they are
     * on a queued status.
     */
    resetQueued (): void {
        if (this.status === 'queued') {
            this.reset(false)
            return
        } else if (this.status === 'running') {
            this.tests.forEach(test => {
                test.resetQueued()
            })
            this.updateStatus()
        }
    }
}
