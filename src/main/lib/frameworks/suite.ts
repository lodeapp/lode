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
    buildTests (result: ISuiteResult, force: boolean): void
    toggleSelected (toggle?: boolean, cascade?: boolean): void
    reset (selective: boolean): void
    queue (selective: boolean): void
    resetQueued (): void
    debrief (result: ISuiteResult, selective: boolean): Promise<void>
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

    /**
     * Create a full result object from a potentially incomplete one.
     *
     * @param partial The potentially incomplete result object.
     */
    public static buildResult (
        partial: object
    ): ISuiteResult {
        return merge({
            file: '',
            tests: [],
            meta: [],
            testsLoaded: true
        }, cloneDeep(partial))
    }

    /**
     * Build this suite from a result object.
     *
     * @param result The result object with which to build this suite.
     */
    protected build (result: ISuiteResult): void {
        this.relative = Path.relative(this.vmPath || this.root, this.file)
        this.testsLoaded = typeof result.testsLoaded !== 'undefined' ? !!result.testsLoaded : true
        this.running = []
        this.buildTests(result, true)
    }

    /**
     * Build this suite's tests from a result object.
     *
     * @param result The result object with which to build this suite's tests.
     * @param force Whether to bypass looking for the tests in the container's current children.
     */
    public buildTests (
        result: ISuiteResult,
        force: boolean = false
    ): void {
        this.tests = result.tests.map((result: ITestResult) => this.makeTest(result, force))
        this.updateStatus()
    }

    /**
     * Instantiate a new test.
     *
     * @param result The test result with which to instantiate a new test.
     */
    protected newTest (result: ITestResult): ITest {
        return new Test(result)
    }

    /**
     * Get this suite's display name.
     */
    public getDisplayName (): string {
        return this.relative
    }

    /**
     * Debrief this suite.
     *
     * @param suiteResult The result object with which to debrief this suite.
     * @param cleanup Whether to clean obsolete children after debriefing.
     */
    public debrief (suiteResult: ISuiteResult, cleanup: boolean): Promise<void> {
        return new Promise((resolve, reject) => {
            this.debriefTests(suiteResult.tests, cleanup)
                .then(() => {
                    this.testsLoaded = typeof suiteResult.testsLoaded !== 'undefined' ? !!suiteResult.testsLoaded : true
                    resolve()
                })
        })
    }
}
