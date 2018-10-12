import * as path from 'path'
import { cloneDeep, debounce, find, merge } from 'lodash'
import { v4 as uuid } from 'uuid'
import { EventEmitter } from 'events'
import { Test, ITest, ITestResult } from '@lib/frameworks/test'
import { Status, parseStatus } from '@lib/frameworks/status'

export type SuiteOptions = {
    path: string,
    vmPath?: string | null
}

export interface ISuite extends EventEmitter {
    readonly id: string
    readonly file: string
    readonly relative: string
    readonly root: string
    status: Status
    tests: Array<ITest>
    selected: boolean
    canToggleTests: boolean

    toggleSelected (toggle?: boolean, cascade?: boolean): void
    debrief (result: ISuiteResult, selective: boolean): Promise<void>
    reset (): void
}

export interface ISuiteResult {
    file: string
    tests: Array<ITestResult>
    meta: Array<any>
}

export class Suite extends EventEmitter implements ISuite {
    public readonly id: string
    public readonly root: string
    public readonly vmPath: string | null
    public readonly file: string
    public relative!: string
    public tests: Array<ITest> = []
    public running: Array<Promise<void>> = []
    public status!: Status
    public selected: boolean = false
    public partial: boolean = false
    public canToggleTests: boolean = false
    public updateCountsListener: any

    constructor (options: SuiteOptions, result: ISuiteResult) {
        super()
        this.id = uuid()
        this.root = options.path
        this.vmPath = options.vmPath || null
        this.file = result.file
        this.updateCountsListener = debounce(this.updateSelectedCounts.bind(this), 100)
        this.build(result)
    }

    static buildResult (partial: object): ISuiteResult {
        return merge({
            file: '',
            tests: [],
            meta: []
        }, cloneDeep(partial))
    }

    build (result: ISuiteResult): void {
        this.relative = path.relative(this.vmPath || this.root, this.file)
        this.tests = result.tests.map((result: ITestResult) => this.makeTest(result, true))
        this.running = []
        this.status = 'idle'
    }

    toggleSelected (toggle?: boolean, cascade?: boolean): void {
        this.selected = typeof toggle === 'undefined' ? !this.selected : toggle
        this.emit('selective')
        if (this.canToggleTests && cascade !== false) {
            this.tests.forEach(test => {
                test.toggleSelected(this.selected)
            })
        }
    }

    debrief (suiteResult: ISuiteResult, selective: boolean): Promise<void> {
        return new Promise((resolve, reject) => {
            suiteResult.tests.forEach((result: ITestResult) => {
                let test: ITest = this.makeTest(result)
                this.running.push(test.debrief(result))
            })

            Promise.all(this.running).then(() => {
                // @TODO: don't clean-up if running selectively
                this.afterDebrief(selective)
                resolve()
            })
        })
    }

    reset (): void {
        this.status = 'idle'
        this.tests.filter(test => test.selected).forEach(test => {
            test.reset()
        })
    }

    afterDebrief (selective: boolean): void {
        if (!selective) {
            console.log('Cleaning up suite')
            this.tests = this.tests.filter(test => test.status !== 'idle')
        }
        this.status = parseStatus(this.tests.map(test => test.status))
    }

    newTest (result: ITestResult): ITest {
        return new Test(result)
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
