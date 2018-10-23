import * as path from 'path'
import { cloneDeep, merge } from 'lodash'
import { v4 as uuid } from 'uuid'
import { EventEmitter } from 'events'
import { Container } from '@lib/frameworks/container'
import { ITest, ITestResult, Test } from '@lib/frameworks/test'
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
    testsLoaded: boolean

    getDisplayName (): string
    toggleSelected (toggle?: boolean, cascade?: boolean): void
    debrief (result: ISuiteResult, selective: boolean): Promise<void>
    reset (): void
}

export interface ISuiteResult {
    file: string
    tests: Array<ITestResult>
    meta: Array<any>
    testsLoaded?: boolean
}

export class Suite extends Container implements ISuite {
    public readonly id: string
    public readonly root: string
    public readonly vmPath: string | null
    public readonly file: string
    public relative!: string
    public running: Array<Promise<void>> = []
    public status!: Status
    public testsLoaded: boolean = true

    constructor (options: SuiteOptions, result: ISuiteResult) {
        super()
        this.id = uuid()
        this.root = options.path
        this.vmPath = options.vmPath || null
        this.file = result.file
        this.build(result)
    }

    static buildResult (
        partial: object
    ): ISuiteResult {
        return merge({
            file: '',
            tests: [],
            meta: [],
            testsLoaded: true
        }, cloneDeep(partial))
    }

    build (result: ISuiteResult): void {
        this.relative = path.relative(this.vmPath || this.root, this.file)
        this.tests = result.tests.map((result: ITestResult) => this.makeTest(result, true))
        this.testsLoaded = typeof result.testsLoaded !== 'undefined' ? !!result.testsLoaded : true
        this.running = []
        this.status = 'idle'
    }

    getDisplayName (): string {
        return this.relative
    }

    newTest (result: ITestResult): ITest {
        return new Test(result)
    }

    updateStatus (to: Status): void {
        const from = this.status
        this.status = to
        this.emit('status', to, from)
    }

    debrief (suiteResult: ISuiteResult, selective: boolean): Promise<void> {
        return new Promise((resolve, reject) => {
            suiteResult.tests.forEach((result: ITestResult) => {
                let test: ITest = this.makeTest(result)
                this.running.push(test.debrief(result))
            })

            Promise.all(this.running).then(() => {
                this.testsLoaded = typeof suiteResult.testsLoaded !== 'undefined' ? !!suiteResult.testsLoaded : true

                // @TODO: don't clean-up if running selectively
                this.afterDebrief(selective)
                resolve()
            })
        })
    }

    afterDebrief (selective: boolean): void {
        if (!selective) {
            console.log('Cleaning up suite')
            this.tests = this.tests.filter(test => test.status !== 'idle')
        }
        this.updateStatus(parseStatus(this.tests.map(test => test.status)))
    }

    reset (): void {
        this.updateStatus('idle')
        super.reset()
    }
}
