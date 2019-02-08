import * as Path from 'path'
import { cloneDeep, merge } from 'lodash'
import { v4 as uuid } from 'uuid'
import { Status, parseStatus } from '@lib/frameworks/status'
import { ITest, ITestResult, Test } from '@lib/frameworks/test'
import { Nugget } from '@lib/frameworks/nugget'

export type SuiteOptions = {
    path: string,
    root: string,
    runsInRemote?: boolean
    remotePath?: string
}

export interface ISuite extends Nugget {
    readonly id: string
    readonly file: string
    readonly relative: string
    readonly path: string
    readonly root: string
    readonly meta: Array<any>
    tests: Array<ITest>
    selected: boolean
    canToggleTests: boolean
    testsLoaded: boolean

    getStatus (): Status
    getDisplayName (): string
    buildTests (result: ISuiteResult, force: boolean): void
    toggleSelected (toggle?: boolean, cascade?: boolean): void
    reset (selective: boolean): void
    queue (selective: boolean): void
    resetQueued (): void
    debrief (result: ISuiteResult, selective: boolean): Promise<void>
    persist (): ISuiteResult
    refresh (options: SuiteOptions): void
}

export interface ISuiteResult {
    file: string
    tests: Array<ITestResult>
    meta?: Array<any>
    testsLoaded?: boolean
}

export class Suite extends Nugget implements ISuite {
    public readonly id: string
    public path: string
    public root: string
    public runsInRemote: boolean
    public remotePath: string
    public file!: string
    public meta!: Array<any>
    public relative!: string
    public running: Array<Promise<void>> = []
    public testsLoaded: boolean = true

    constructor (options: SuiteOptions, result: ISuiteResult) {
        super()
        this.id = uuid()
        this.path = options.path
        this.root = options.root
        this.runsInRemote = options.runsInRemote || false
        options.remotePath = options.remotePath || ''
        this.remotePath = options.remotePath.startsWith('/') ? options.remotePath : '/' + options.remotePath
        this.build(result)
    }

    /**
     * Prepares the suite for persistence.
     */
    public persist (): ISuiteResult {
        return {
            file: this.file,
            meta: this.meta,
            tests: this.tests.map((test: ITest) => test.persist()),
            testsLoaded: this.testsLoaded
        }
    }

    /**
     * Refresh this suite's metadata.
     *
     * @param options The suite's new options.
     */
    public refresh (options: SuiteOptions): void {
        this.path = options.path
        this.root = options.root
        this.runsInRemote = options.runsInRemote || false
        options.remotePath = options.remotePath || ''
        this.remotePath = options.remotePath.startsWith('/') ? options.remotePath : '/' + options.remotePath
        this.build({
            ...this.persist(),
            // We'll fetch the results from our suites directly, as we want to
            // keep them after a refresh (as opposed to persisting them between
            // different app sessions.)
            ...{ tests: this.tests.map((test: ITest) => test.result!) }
        })
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
        this.file = result.file
        this.relative = this.runsInRemote && this.remotePath === '/'
            ? this.file
            : Path.relative(this.runsInRemote ? (Path.join(this.remotePath, this.path)) : this.root, this.file)
        this.meta = result.meta!
        this.testsLoaded = typeof result.testsLoaded !== 'undefined' ? !!result.testsLoaded : true
        this.running = []
        this.buildTests(result, true)
    }

    /**
     * Build this suite's tests from a result object.
     *
     * @param result The result object with which to build this suite's tests.
     * @param force Whether to bypass looking for the tests in the suite's current children.
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
     * Update this suite's status.
     *
     * Override default status parsing to make sure we don't mark suites
     * without loaded tests as "empty". Mark them as "idle", instead.
     *
     * @param to The status we're updating to.
     */
    protected updateStatus (to?: Status): void {
        if (typeof to === 'undefined') {
            to = parseStatus(this.tests.map(test => test.getStatus()))
            if (to === 'empty' && !this.testsLoaded) {
                to = 'idle'
            }
        }
        super.updateStatus(to)
    }

    /**
     * Get this suite's status.
     */
    public getStatus (): Status {
        // If tests haven't been loaded, suite status will of course come back
        // as empty. This won't be confirmed until we actually  parse the suite
        // and load its tests, so until then we'll force an "idle" status.
        if (!this.testsLoaded && this.status === 'empty') {
            return 'idle'
        }
        return this.status
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
