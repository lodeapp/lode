import * as Path from 'path'
import { flatten, get, omit, trimStart } from 'lodash'
import { File } from '@main/file'
import { Status, parseStatus } from '@lib/frameworks/status'
import { IFramework } from '@lib/frameworks/framework'
import { ITest, ITestResult, Test } from '@lib/frameworks/test'
import { Nugget } from '@lib/frameworks/nugget'

export interface ISuite extends Nugget {
    readonly file: string

    getId (): string
    getFile (): string
    getFilePath (): string
    getRelativePath (): string
    getFilePathRelativeToBase (): string
    getDisplayName (): string
    getStatus (): Status
    getNuggetIds (selective: boolean): Array<string>
    getMeta (): any
    resetMeta (): void
    getConsole (): Array<any> | null
    getFramework (): IFramework
    testsLoaded (): boolean
    rebuildTests (result: ISuiteResult): Promise<void>
    canBeOpened (): boolean
    open (): void
    canToggleTests (): boolean
    toggleSelected (toggle?: boolean, cascade?: boolean): Promise<void>
    toggleExpanded (toggle?: boolean, cascade?: boolean): Promise<void>
    debrief (result: ISuiteResult, selective: boolean): Promise<void>
    render (status?: Status | false): ISuiteResult
    persist (status?: Status | false): ISuiteResult
    setFresh (fresh: boolean): void
    isFresh (): boolean
    countChildren (): number
    hasChildren(): boolean
    contextMenu (): Array<Electron.MenuItemConstructorOptions>
    getRunningOrder (): number | null
}

export interface ISuiteResult {
    file: string
    status?: Status
    tests?: Array<ITestResult>
    meta?: object | null
    console?: Array<any>
    testsLoaded?: boolean
    hasChildren?: boolean
    selected?: boolean
    partial?: boolean
    relative?: string
}

export class Suite extends Nugget implements ISuite {
    public file!: string
    protected result!: ISuiteResult

    constructor (framework: IFramework, result: ISuiteResult) {
        super(framework)
        this.build(result)
    }

    /**
     * Prepares the suite for sending out to renderer process.
     *
     * @param status Which status to recursively set on tests. False will persist current status.
     */
    public render (status: Status | false = 'idle'): ISuiteResult {
        return {
            file: this.file,
            meta: this.getMeta(),
            hasChildren: this.testsLoaded() && this.hasChildren(),
            selected: this.selected,
            partial: this.partial,
            relative: this.getRelativePath()
        }
    }

    /**
     * Prepares the suite for persistence.
     *
     * @param status Which status to recursively set on tests. False will persist current status.
     */
    public persist (status: Status | false = 'idle'): ISuiteResult {
        return omit({
            ...this.render(),
            testsLoaded: this.testsLoaded(),
            tests: this.bloomed
                ? this.tests.map((test: ITest) => test.persist(status))
                : this.getTestResults().map((test: ITestResult) => this.defaults(test, status))
        }, ['hasChildren', 'selected', 'partial', 'relative'])
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
    public async rebuildTests (result: ISuiteResult): Promise<void> {
        this.tests = (result.tests || []).map((result: ITestResult) => {
            return this.makeTest(result, false)
        })

        if (!this.expanded) {
            await this.wither()
        }

        // Update the status in case new tests have been created
        // or old tests have been removed.
        this.updateStatus()
    }

    /**
     * Whether the suite's file can be opened.
     */
    public canBeOpened (): boolean {
        return File.isSafe(this.getFilePath()) && File.exists(this.getFilePath())
    }

    /**
     * Open the suite's file.
     */
    public open (): void {
        File.open(this.getFilePath())
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
        return new Test(this.framework, result)
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
                : this.getTestResults().map((test: ITestResult) => this.framework.getNuggetStatus(test.id))
            to = parseStatus(statuses)
            if (to === 'empty' && !this.testsLoaded()) {
                to = 'idle'
            }
        }
        const from = this.getStatus()
        if (to !== from) {
            this.framework.setNuggetStatus(this.getId(), to, from, true)
        }
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
     * Get this suite's file path relative
     * to the base path in the framework settings, if any.
     */
    public getRelativePath (): string {
        return this.framework.runsInRemote && (!this.framework.getRemotePath() || this.framework.getRemotePath() === '/')
            ? trimStart(this.file, '/')
            : Path.relative(
                this.framework.runsInRemote
                    ? (Path.join(this.framework.getRemotePath(), this.framework.path))
                    : this.framework.fullPath,
                this.file
            )
    }

    /**
     * Get this suite's file path relative
     * to the root of the repository.
     */
    public getFilePathRelativeToBase (): string {
        if (!this.framework.runsInRemote) {
            return Path.join(this.framework.path, Path.relative(this.framework.fullPath, this.file))
        }

        return Path.relative(this.framework.getRemotePath(), this.file)
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
        if (super.getStatus() === 'empty' && !this.testsLoaded()) {
            return 'idle'
        }
        return super.getStatus()
    }

    /**
     * Get the ids of this suite and the nuggets it is supposed to run.
     */
    public getNuggetIds (selective: boolean): Array<string> {
        return flatten([
            this.getId(),
            ...(
                selective && this.canToggleTests()
                    ? this.tests
                        .filter(test => test.selected)
                        .map((test: ITest) => this.getRecursiveNuggetIds(test.getResult()))
                    : (this.bloomed
                        ? this.tests.map((test: ITest) => this.getRecursiveNuggetIds(test.getResult()))
                        : (this.result.tests || []).map((test: ITestResult) => {
                            return this.getRecursiveNuggetIds(test)
                        })
                    )
            )
        ])
    }

    /**
     * Get metadata for this suite.
     */
    public getMeta (key?: string, fallback?: any): any {
        if (!key) {
            return this.result.meta || {}
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
     * Get this suite's console output.
     */
    public getConsole (): Array<any> | null {
        return this.result.console && this.result.console.length ? this.result.console : null
    }

    /**
     * Get this suites's parent framework.
     */
    public getFramework (): IFramework {
        return this.framework
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
        return this.result.testsLoaded !== false
    }

    /**
     * Debrief this suite.
     *
     * @param result The result object with which to debrief this suite.
     * @param cleanup Whether to clean obsolete children after debriefing.
     */
    public async debrief (result: ISuiteResult, cleanup: boolean): Promise<void> {
        const emit = !this.testsLoaded()
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
                        if (emit) {
                            // Only emit the :children event if tests weren't loaded initially.
                            this.emitToRenderer(`${this.getId()}:children`, this.testsLoaded() && this.hasChildren())
                        }
                        resolve()
                    })
            })
        })
    }
}
