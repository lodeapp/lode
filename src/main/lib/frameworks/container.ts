import { debounce, find } from 'lodash'
import { EventEmitter } from 'events'
import { ITest, ITestResult } from '@lib/frameworks/test'
import { Status, parseStatus } from '@lib/frameworks/status'

export abstract class Container extends EventEmitter {
    public tests: Array<ITest> = []
    public status: Status = 'idle'
    public selected: boolean = false
    public partial: boolean = false
    public debriefing: boolean = false
    public canToggleTests: boolean = false
    public updateCountsListener: any

    constructor () {
        super()
        this.updateCountsListener = debounce(this.updateSelectedCounts.bind(this), 100)
    }

    abstract newTest (result: ITestResult): ITest

    toggleSelected (toggle?: boolean, cascade?: boolean): void {
        this.selected = typeof toggle === 'undefined' ? !this.selected : toggle
        this.emit('selective', this)
        if (this.canToggleTests && cascade !== false) {
            this.tests.forEach(test => {
                test.toggleSelected(this.selected)
            })
        }
    }

    findTest (name: string): ITest | undefined {
        return find(this.tests, { name })
    }

    makeTest (
        result: ITestResult,
        force: boolean = false
    ): ITest {
        let test: ITest | undefined | boolean = force ? false : this.findTest(result.name)
        if (!test) {
            test = this.newTest(result)
            test.on('selective', this.updateCountsListener)
            this.tests.push(test)
        }
        return test
    }

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

    debriefTests (tests: Array<ITestResult>, cleanup: boolean) {
        this.debriefing = true
        return new Promise((resolve, reject) => {
            const running: Array<Promise<void>> = []
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

    afterDebrief (cleanup: boolean, isLast: number): void {
        if (cleanup) {
            this.tests = this.tests.filter(test => test.status !== 'idle')
        }
        this.updateStatus(parseStatus(this.tests.map(test => test.status)))

        // If tests do not support last markings, or this is the actual
        // last test, set debrifing to false, otherwise let the flag stay
        // for this iteration.
        if (isLast >= 1 || isLast < 0) {
            this.debriefing = false
        }
    }

    updateStatus (to: Status): void {
        const from = this.status
        this.status = to
        this.emit('status', to, from)
    }

    reset (selective: boolean): void {
        this.updateStatus('idle')
        this.tests.filter(test => selective && this.canToggleTests ? test.selected : true)
            .forEach(test => {
                test.reset(selective)
            })
    }

    queue (selective: boolean): void {
        this.updateStatus('queued')
        this.tests.filter(test => selective && this.canToggleTests ? test.selected : true)
            .forEach(test => {
                test.queue(selective)
            })
    }
}
