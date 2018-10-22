import { debounce, find } from 'lodash'
import { EventEmitter } from 'events'
import { ITest, ITestResult } from '@lib/frameworks/test'

export abstract class Container extends EventEmitter {
    public tests: Array<ITest> = []
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

    reset (): void {
        this.tests.filter(test => {
            if (!this.canToggleTests) {
                return true
            }
            return test.selected
        }).forEach(test => {
            test.reset()
        })
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
}
