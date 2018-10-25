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
    public updateCountsListener: any

    constructor () {
        super()
        this.updateCountsListener = debounce(this.updateSelectedCounts.bind(this), 100)
    }

    abstract newTest (result: ITestResult): ITest

    toggleSelected (toggle?: boolean, cascade?: boolean): void {
        this.selected = typeof toggle === 'undefined' ? !this.selected : toggle
        this.emit('selective')
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
        this.emit('selective')
    }

    debriefTests (tests: Array<ITestResult>, selective: boolean) {
        return new Promise((resolve, reject) => {
            const running: Array<Promise<void>> = []
            tests.forEach((result: ITestResult) => {
                let test: ITest = this.makeTest(result)
                running.push(test.debrief(result, selective))
            })

            Promise.all(running).then(() => {
                // @TODO: don't clean-up if running selectively
                this.afterDebrief(selective)
                resolve()
            })
        })
    }

    afterDebrief (selective: boolean): void {
        if (!selective) {
            console.log('Cleaning up container')
            this.tests = this.tests.filter(test => test.status !== 'idle')
        }
        this.updateStatus(parseStatus(this.tests.map(test => test.status)))
    }

    updateStatus (to: Status): void {
        const from = this.status
        this.status = to
        this.emit('status', to, from)
    }

    reset (): void {
        this.updateStatus('idle')
        this.tests.filter(test => this.canToggleTests ? test.selected : true)
            .forEach(test => {
                test.updateStatus('idle')
            })
    }
}
