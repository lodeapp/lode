import * as Path from 'path'
import { get, omit } from 'lodash'
import { v4 as uuid } from 'uuid'
import { Status, parseStatus } from '@main/lib/frameworks/status'
import { ITest, ITestResult, Test } from '@main/lib/frameworks/test'
import { Nugget } from '@main/lib/frameworks/nugget'

export type SuiteOptions = {
    path: string,
    root: string,
    runsInRemote?: boolean
    remotePath?: string
}

export interface ISuite extends Nugget {
    readonly id: string
    readonly file: string
    readonly path: string
    readonly root: string
    tests: Array<ITest>
    selected: boolean
    canToggleTests: boolean

    getStatus (): Status
    getFilePath (): string
    getRelativePath (): string
    getDisplayName (): string
    getMeta (): Array<any>
    getConsole (): Array<any>
    testsLoaded (): boolean
    buildTests (result: ISuiteResult, force: boolean): void
    toggleSelected (toggle?: boolean, cascade?: boolean): void
    reset (selective: boolean): void
    queue (selective: boolean): void
    resetQueued (): void
    debrief (result: ISuiteResult, selective: boolean): Promise<void>
    persist (): ISuiteResult
    refresh (options: SuiteOptions): void
    setFresh (fresh: boolean): void
    isFresh (): boolean
    contextMenu (): Array<Electron.MenuItemConstructorOptions>
}

export interface ISuiteResult {
    file: string
    tests?: Array<ITestResult>
    meta?: Array<any>
    console?: Array<any>
    testsLoaded?: boolean
    version?: string
}

export class Suite extends Nugget implements ISuite {
    public readonly id: string
    public path: string
    public root: string
    public runsInRemote: boolean
    public remotePath: string
    public file!: string
    public result!: ISuiteResult

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
            meta: this.getMeta(),
            tests: this.tests.map((test: ITest) => test.persist()),
            testsLoaded: this.testsLoaded()
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
     * Build this suite from a result object.
     *
     * @param result The result object with which to build this suite.
     */
    protected build (result: ISuiteResult): void {
        this.file = result.file
        this.result = omit(result, 'tests')
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
        this.tests = result.tests ? result.tests.map((result: ITestResult) => {
            return this.makeTest(result, force)
        }) : []
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
            if (to === 'empty' && !this.testsLoaded()) {
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
        if (!this.testsLoaded() && this.status === 'empty') {
            return 'idle'
        }
        return this.status
    }

    /**
     * Get this suite's local file path, regardless of running remotely.
     */
    public getFilePath (): string {
        if (!this.runsInRemote) {
            return this.file
        }

        return Path.join(this.root, Path.relative(Path.join(this.remotePath, this.path), this.file))
    }

    /**
     * Get this suite's relative file path.
     */
    public getRelativePath (): string {
        return this.runsInRemote && this.remotePath === '/'
            ? this.file
            : Path.relative(this.runsInRemote ? (Path.join(this.remotePath, this.path)) : this.root, this.file)
    }

    /**
     * Get this suite's display name.
     */
    public getDisplayName (): string {
        return this.getRelativePath()
    }

    /**
     * Get the framework version from this suite, if any.
     */
    public getVersion (): string | undefined {
        return this.result.version
    }

    /**
     * Get metadata for this suite.
     */
    public getMeta (key?: string, fallback?: any): any {
        if (!key) {
            return this.result.meta!
        }

        return get(this.result.meta!, key, fallback)
    }

    /**
     * Get this nugget's console output.
     */
    public getConsole (): Array<any> {
        return this.result.console!
    }

    /**
     * Whether this suite's tests are loaded.
     */
    public testsLoaded (): boolean {
        return this.result.testsLoaded!
    }

    /**
     * Debrief this suite.
     *
     * @param result The result object with which to debrief this suite.
     * @param cleanup Whether to clean obsolete children after debriefing.
     */
    public debrief (result: ISuiteResult, cleanup: boolean): Promise<void> {
        this.file = result.file
        this.result = omit(result, 'tests')
        return new Promise((resolve, reject) => {
            this.debriefTests(result.tests!, cleanup)
                .then(() => {
                    resolve()
                })
        })
    }
}
