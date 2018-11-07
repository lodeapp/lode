import * as Path from 'path'
import { cloneDeep, merge } from 'lodash'
import { v4 as uuid } from 'uuid'
import { Container } from '@lib/frameworks/container'
import { ITest, ITestResult, Test } from '@lib/frameworks/test'

export type SuiteOptions = {
    path: string,
    vmPath?: string | null
}

export interface ISuite extends Container {
    readonly id: string
    readonly file: string
    readonly relative: string
    readonly root: string
    tests: Array<ITest>
    selected: boolean
    canToggleTests: boolean
    testsLoaded: boolean

    getDisplayName (): string
    toggleSelected (toggle?: boolean, cascade?: boolean): void
    debrief (result: ISuiteResult, selective: boolean): Promise<void>
    reset (selective: boolean): void
    queue (selective: boolean): void
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
        this.relative = Path.relative(this.vmPath || this.root, this.file)
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

    debrief (suiteResult: ISuiteResult, cleanup: boolean): Promise<void> {
        return new Promise((resolve, reject) => {
            this.debriefTests(suiteResult.tests, cleanup)
                .then(() => {
                    this.testsLoaded = typeof suiteResult.testsLoaded !== 'undefined' ? !!suiteResult.testsLoaded : true
                    resolve()
                })
        })
    }
}
