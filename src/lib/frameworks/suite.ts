import * as Path from 'path'
import { get } from 'lodash'
import { Status, parseStatus } from '@lib/frameworks/status'
import { IFramework } from '@lib/frameworks/framework'
import { ITest, ITestResult, Test } from '@lib/frameworks/test'
import { Nugget } from '@lib/frameworks/nugget'

export interface ISuite extends Nugget {
    readonly file: string
    tests: Array<ITest>
    selected: boolean

    getId (): string
    getFile (): string
    getFilePath (): string
    getRelativePath (): string
    getDisplayName (): string
    getStatus (): Status
    getMeta (): any
    resetMeta (): void
    getConsole (): Array<any>
    testsLoaded (): boolean
    rebuildTests (result: ISuiteResult): void
    canToggleTests (): boolean
    toggleSelected (toggle?: boolean, cascade?: boolean): Promise<void>
    toggleExpanded (toggle?: boolean, cascade?: boolean): Promise<void>
    idle (selective: boolean): void
    queue (selective: boolean): void
    error (selective: boolean): void
    idleQueued (selective: boolean): void
    errorQueued (selective: boolean): void
    debrief (result: ISuiteResult, selective: boolean): Promise<void>
    persist (): ISuiteResult
    setFresh (fresh: boolean): void
    isFresh (): boolean
    countChildren (): number
    hasChildren(): boolean
    contextMenu (): Array<Electron.MenuItemConstructorOptions>
    getRunningOrder (): number | null
    getLastUpdated (): string | null
    getLastRun (): string | null
    getTotalDuration (): number
    getMaxDuration (): number
}

export interface ISuiteResult {
    file: string
    tests?: Array<ITestResult>
    meta?: object | null
    console?: Array<any>
    testsLoaded?: boolean
}

export class Suite extends Nugget implements ISuite {
    public file!: string
    public result!: ISuiteResult
    protected framework: IFramework

    constructor (framework: IFramework, result: ISuiteResult) {
        super()
        this.framework = framework
        // this.path = options.path
        // this.root = options.root
        // this.runsInRemote = options.runsInRemote || false
        // options.remotePath = options.remotePath || ''
        // this.remotePath = options.remotePath.startsWith('/') ? options.remotePath : '/' + options.remotePath
        this.build(result)
    }

    /**
     * Prepares the suite for persistence.
     */
    public persist (): ISuiteResult {
        return {
            file: this.file,
            meta: this.getMeta(),
            testsLoaded: this.testsLoaded(),
            tests: this.bloomed
                ? this.tests.map((test: ITest) => test.persist())
                : this.getTestResults().map((test: ITestResult) => this.defaults(test)),
        }
    }

    /**
     * Build this suite from a result object.
     *
     * @param result The result object with which to build this suite.
     */
    protected build (result: ISuiteResult): void {
        this.file = result.file
        this.result = result
        if (this.expanded) {
            this.bloom().then(() => {
                this.updateStatus()
            })
        } else {
            this.updateStatus()
        }
    }

    /**
     * Rebuild this suite's tests from a result object.
     *
     * @param result The result object with which to build this suite's tests.
     */
    public rebuildTests (result: ISuiteResult): void {
        // Bloom the suite before rebuilding tests, so we can map the existing
        // tests more precisely.
        this.bloom().then(() => {
            this.tests = (result.tests || []).map((result: ITestResult) => {
                return this.makeTest(result, false)
            })

            if (!this.expanded) {
                this.wither()
            }

            // Update the status in case new tests have been created
            // or old tests have been removed.
            this.updateStatus()
        })
    }

    /**
     * Whether the suite can run tests selectively.
     */
    public canToggleTests (): boolean {
        return this.framework.canToggleTests
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
            const statuses = this.bloomed
                ? this.tests.map((test: ITest) => test.getStatus())
                : this.getTestResults().map((test: ITestResult) => test.status)
            to = parseStatus(statuses)
            if (to === 'empty' && !this.testsLoaded()) {
                to = 'idle'
            }
        }
        super.updateStatus(to)
    }

    /**
     * Get this suite's id.
     */
    public getId (): string {
        return this.file!
    }

    /**
     * Get this suite's file.
     */
    public getFile (): string {
        return this.file!
    }

    /**
     * Get this suite's local file path, regardless of running remotely.
     */
    public getFilePath (): string {
        if (!this.framework.runsInRemote) {
            return this.file
        }

        return Path.join(
            this.framework.fullPath,
            Path.relative(
                Path.join(
                    this.framework.getRemotePath(),
                    this.framework.path
                ),
                this.file
            )
        )
    }

    /**
     * Get this suite's relative file path.
     */
    public getRelativePath (): string {
        return this.framework.runsInRemote && this.framework.getRemotePath() === '/'
            ? this.file
            : Path.relative(
                this.framework.runsInRemote
                    ? (Path.join(this.framework.getRemotePath(), this.framework.path))
                    : this.framework.fullPath,
                this.file
            )
    }

    /**
     * Get this suite's display name.
     */
    public getDisplayName (): string {
        return this.getRelativePath()
    }

    /**
     * Get this suite's status.
     */
    public getStatus (): Status {
        // If tests haven't been loaded, suite status will of course come back
        // as empty. This won't be confirmed until we actually  parse the suite
        // and load its tests, so until then we'll force an "idle" status.
        if (this.status === 'empty' && !this.testsLoaded()) {
            return 'idle'
        }
        return this.status
    }

    /**
     * Get metadata for this suite.
     */
    public getMeta (key?: string, fallback?: any): any {
        if (!key) {
            return this.result.meta!
        }

        return !this.result.meta ? fallback : get(this.result.meta!, key, fallback)
    }

    /**
     * Reset metadata for this suite.
     */
    public resetMeta (): void {
        if (this.result.meta) {
            this.result.meta = null
        }
    }

    /**
     * Get this nugget's console output.
     */
    public getConsole (): Array<any> {
        return this.result.console!
    }

    /**
     * Get this nugget's running order, if any.
     */
    public getRunningOrder (): number | null {
        return this.getMeta('n', null)
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
    public async debrief (result: ISuiteResult, cleanup: boolean): Promise<void> {
        this.file = result.file
        this.result.meta = result.meta
        this.result.console = result.console
        this.result.testsLoaded = result.testsLoaded
        return new Promise((resolve, reject) => {
            // Bloom suite before debriefing, which ensures we can find and
            // create tests using the actual models, not plain results.
            this.bloom().then(() => {
                this.debriefTests(result.tests || [], cleanup)
                    .then(() => {
                        resolve()
                    })
            })
        })
    }
}
