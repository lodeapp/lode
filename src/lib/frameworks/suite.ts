import * as path from 'path'
import { cloneDeep, find, merge } from 'lodash'
import { v4 as uuid } from 'uuid'
import { Test, ITest, ITestResult } from '@lib/frameworks/test'
import { Status, parseStatus } from '@lib/frameworks/status'

export type SuiteOptions = {
    path: string,
    vmPath?: string | null
}

export interface ISuite {
    readonly id: string
    readonly file: string
    readonly relative: string
    readonly root: string
    status: Status
    tests: Array<ITest>
    selected: boolean
    canToggleTests: boolean

    toggleSelected (toggle?: boolean, cascade?: boolean): void
    noTestsSelected (): boolean
    debrief (result: ISuiteResult): Promise<void>
    reset (): void
}

export interface ISuiteResult {
    file: string
    tests: Array<ITestResult>
}

export class Suite implements ISuite {
    public readonly id: string
    public readonly root: string
    public readonly vmPath: string | null
    public readonly file: string
    public relative!: string
    public tests: Array<ITest> = []
    public running: Array<Promise<void>> = []
    public status!: Status
    public selective: boolean = false
    public selected: boolean = true
    public canToggleTests: boolean = false

    constructor (options: SuiteOptions, result: ISuiteResult) {
        this.id = uuid()
        this.root = options.path
        this.vmPath = options.vmPath || null
        this.file = result.file
        this.build(result)
    }

    static buildResult (partial: object): ISuiteResult {
        return merge({
            file: '',
            tests: []
        }, cloneDeep(partial))
    }

    build (result: ISuiteResult): void {
        this.relative = path.relative(this.vmPath || this.root, this.file)
        this.tests = result.tests.map((result: ITestResult) => this.newTest(result))
        this.running = []
        this.status = 'idle'
    }

    toggleSelected (toggle?: boolean, cascade?: boolean): void {
        this.selected = typeof toggle === 'undefined' ? !this.selected : toggle
        if (this.canToggleTests && cascade !== false) {
            this.tests.forEach(test => {
                test.toggleSelected(this.selected)
            })
        }
    }

    noTestsSelected (): boolean {
        return this.tests.filter(test => test.selected).length === 0
    }

    debrief (suiteResult: ISuiteResult): Promise<void> {
        return new Promise((resolve, reject) => {
            suiteResult.tests.forEach((result: ITestResult) => {
                let test: ITest = this.makeTest(result)
                this.running.push(test.debrief(result))
            })

            Promise.all(this.running).then(() => {
                // @TODO: don't clean-up if running selectively
                this.afterDebrief(true)
                resolve()
            })
        })
    }

    reset (): void {
        this.status = 'idle'
        this.tests.forEach(test => {
            test.reset()
        })
    }

    afterDebrief (cleanup: boolean = false): void {
        console.log('cleaning up suite')
        if (cleanup) {
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

    makeTest (result: ITestResult): ITest {
        let test: ITest | undefined = this.findTest(result.name)
        if (!test) {
            test = this.newTest(result)
            this.tests.push(test)
        }
        return test
    }
}
