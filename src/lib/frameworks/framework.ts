import * as Path from 'path'
import * as Fs from 'fs-extra'
import { chunk, debounce, find, findIndex, get, omit, orderBy, trim, trimStart } from 'lodash'
import { v4 as uuid } from 'uuid'
import * as fuzzy from 'fuzzysearch'
import { ApplicationWindow } from '@main/application-window'
import { ProcessId, IProcess } from '@lib/process/process'
import { ProcessFactory } from '@lib/process/factory'
import { queue } from '@lib/process/queue'
import { ProjectEventEmitter } from '@lib/frameworks/emitter'
import { IRepository, ParsedRepository } from '@lib/frameworks/repository'
import { Suite, ISuite, ISuiteResult } from '@lib/frameworks/suite'
import { FrameworkStatus, Status, StatusLedger, StatusMap, parseStatus } from '@lib/frameworks/status'
import { ProgressLedger } from '@lib/frameworks/progress'
import { FrameworkSort, sortDirection } from '@lib/frameworks/sort'
import { FrameworkValidator } from '@lib/frameworks/validator'
import { SSHOptions } from '@lib/process/ssh'
import pool from '@lib/process/pool'

/**
 * Framework object with repository context
 */
export type FrameworkWithContext = {
    repository: IRepository
    framework: IFramework
}

/**
 * Possible outcomes for a framework reload process
 */
export type FrameworkReloadOutcome = 'success' | 'killed' | 'empty'

/**
 * A list of test suites.
 */
export type SuiteList = {
    suites: Array<ISuite>
}

/**
 * A list of possible framework filters.
 */
export type FrameworkFilter = 'keyword' | 'status' | 'group'

/**
 * Options to instantiate a Framework with.
 */
export type FrameworkOptions = {
    id?: string
    name: string
    type: string
    command: string
    runner?: string
    path: string
    repositoryPath?: string
    runsInRemote?: boolean
    remotePath?: string
    sshHost?: string
    sshUser?: string | null
    sshPort?: number | null
    sshIdentity?: string | null
    active?: boolean
    suites?: Array<ISuiteResult>
    scanStatus?: 'pending' | 'removed'
    proprietary: any
    sort?: FrameworkSort
    selected?: number
    canToggleTests?: boolean
    status?: FrameworkStatus
}

/**
 * An object to declare default framework options.
 */
export type FrameworkDefaults = {
    all: FrameworkOptions
    darwin?: object
    win32?: object
    linux?: object
}

/**
 * The Framework interface.
 */
export interface IFramework extends ProjectEventEmitter {
    name: string
    type: string
    path: string
    repositoryPath: string
    fullPath: string
    runsInRemote: boolean,
    remotePath: string | null
    status: FrameworkStatus
    readonly canToggleTests: boolean

    getId (): string
    getDisplayName (): string
    getRemotePath (): string
    getFullRemotePath (): string
    start (): void
    refresh (): void
    stop (): Promise<any>
    reset (): Promise<any>
    isRunning (): boolean
    isRefreshing (): boolean
    isBusy (): boolean
    empty (): boolean
    count (): number
    render (): FrameworkOptions
    persist (): FrameworkOptions
    save (): void
    updateOptions (options: FrameworkOptions): Promise<void>
    setActive (active: boolean): void
    isActive (): boolean
    isSelective (): boolean
    getAllSuites (): Array<ISuite>
    getSuites (): Array<ISuite>
    getSuiteById (id: string): ISuite | undefined
    getSelected (): SuiteList
    emitSuitesToRenderer (): void
    setFilter (filter: FrameworkFilter, value: Array<string> | string | null): void
    getFilter (filter: FrameworkFilter): Array<string> | string | null
    hasFilters (): boolean
    resetFilters (): void
    getLedger (): StatusLedger
    getStatusMap (): StatusMap
    getNuggetStatus (id: string): Status
    setNuggetStatus (id: string, to: Status, from: Status, updateLedger: boolean): void
    getProgressLedger (): ProgressLedger
    resetProgressLedger (): void
    processFeedbackText (text: string): string
}

/**
 * The Framework class represents a testing framework (e.g. Jest, PHPUnit)
 * and contains a set of test suites (files).
 */
export abstract class Framework extends ProjectEventEmitter implements IFramework {
    public name!: string
    public type!: string
    public path!: string
    public repositoryPath!: string
    public fullPath!: string
    public remotePath!: string
    public runsInRemote!: boolean
    public status: FrameworkStatus = 'loading'
    public readonly canToggleTests: boolean = false

    protected id!: string

    protected command!: string
    protected sshHost!: string
    protected sshUser!: string | null
    protected sshPort!: number | null
    protected sshIdentity!: string | null
    protected runner!: string | null
    protected process?: ProcessId
    protected running: Array<Promise<void>> = []
    protected killed = false
    protected queue: { [index: string]: Function } = {}

    protected ready = false
    protected suites: Array<ISuite> = []
    protected selective = false
    protected selected: SuiteList = {
        suites: []
    }
    protected maxSelective = 200
    protected initialSuiteCount = 0
    protected initialSuiteReady = 0
    protected hasSuites = false
    protected proprietary: any = {}
    protected active = false
    protected filters: { [key in FrameworkFilter]: Array<string> | string | null } = {
        keyword: null,
        status: null,
        group: null
    }
    protected sort!: FrameworkSort
    protected ledger: StatusLedger = {
        queued: 0,
        running: 0,
        passed: 0,
        failed: 0,
        incomplete: 0,
        skipped: 0,
        warning: 0,
        partial: 0,
        empty: 0,
        idle: 0,
        error: 0
    }
    protected statuses: { [key: string]: Status } = {}
    protected progressLedger: ProgressLedger = {
        run: 0,
        total: 0
    }
    protected emitLedgerToRenderer: _.DebouncedFunc<() => Promise<void>>

    static readonly defaults?: FrameworkDefaults
    static readonly sortDefault: FrameworkSort = 'name'

    constructor (window: ApplicationWindow, options: FrameworkOptions) {
        super(window)

        // Debounce sending ledger and status to renderer
        this.emitLedgerToRenderer = debounce(() => {
            this.emitToRenderer(`${this.id}:ledger`, this.ledger, this.statuses)
        }, 30)

        this.build(options).then(() => {
            // If options include suites already (i.e. persisted state), add them.
            this.loadSuites(options.suites || [])
        })
    }

    /**
     * Build the framework from the given options. This is essentially
     * the constructor, but it's abstracted so we can rebuild the object
     * in case the options are updated at runtime.
     *
     * @param options The options to build the framework with.
     */
    protected async build (options: FrameworkOptions): Promise<void> {
        this.id = options.id || uuid()
        this.name = options.name
        this.type = options.type
        this.command = options.command.trim()
        this.path = trimStart(options.path, '/')
        this.repositoryPath = options.repositoryPath || ''
        this.fullPath = this.path ? Path.join(this.repositoryPath, this.path) : this.repositoryPath
        this.runsInRemote = options.runsInRemote || false
        this.remotePath = options.remotePath || ''
        this.sshHost = options.sshHost || ''
        this.sshUser = options.sshUser || null
        this.sshPort = options.sshPort || null
        this.sshIdentity = options.sshIdentity || null
        this.runner = options.runner || ''

        // Usage of `this.constructor` means that we can allow individual framework
        // implementations to override the static properties with their own defaults.
        this.proprietary = options.proprietary || {
            ...(this.constructor as typeof Framework).getDefaults().proprietary
        }
        this.active = options.active || false
        this.sort = options.sort || (this.constructor as typeof Framework).sortDefault

        this.initialSuiteCount = (options.suites || []).length
        this.hasSuites = this.initialSuiteCount > 0
    }

    /**
     * Prepare this framework for running.
     */
    protected async assemble (): Promise<void> {
        this.emit('state')
        this.emit('assembled')
        log.debug(`Assembled ${this.name}`)
    }

    /**
     * Prepare this framework for running.
     */
    protected injectPath (): string {
        return Path.join(this.repositoryPath, '.lode', this.type)
    }

    /**
     * Clean-up after running a process for this framework.
     */
    protected async disassemble (): Promise<void> {
        if (this.runsInRemote) {
            try {
                await Fs.remove(this.injectPath())
                const files = await Fs.readdir(Path.join(this.repositoryPath, '.lode'))
                if (!files.length) {
                    await Fs.remove(Path.join(this.repositoryPath, '.lode'))
                }
            } catch (error) {
                // Fail silently if folder is not found
                // or can't be removed.
            }
        }
        this.emit('state')
        this.emit('disassembled')
        log.debug(`Disassembled ${this.name}`)
    }

    /**
     * The command arguments for running this framework.
     */
    protected abstract runArgs (): Array<string>

    /**
     * The command arguments for running this framework selectively.
     *
     * @param suites The suites selected to run.
     * @param selectTests Whether to check for selected tests, or run the entire suite.
     */
    protected abstract runSelectiveArgs (suites: Array<ISuite>, selectTests: boolean): Array<string>

    /**
     * Reload this framework's suites and tests.
     */
    protected abstract reload (): Promise<FrameworkReloadOutcome>

    /**
     * Test the given files for framework existence and return appropriate
     * instantiation options, if applicable.
     *
     * Must be implemented by the frameworks themselves. It should be considered
     * an abstract method, but Typescript doesn't support abstract static methods.
     *
     * @param repository The parsed repository to test.
     */
    public static async spawnForDirectory (repository: ParsedRepository): Promise<FrameworkOptions | false> {
        return false
    }

    /**
     * Hydrate a partial object with the default framework options.
     *
     * @param options An potentially partial framework options object.
     */
    public static hydrate (options?: object): FrameworkOptions {
        options = options || {}
        const defaults = {
            ...{
                name: '',
                type: '',
                command: '',
                path: '',
                runsInRemote: false,
                proprietary: {}
            },
            ...this.getDefaults()
        }

        return {
            ...defaults,
            ...options
        }
    }

    public static getDefaults (): FrameworkOptions {
        return {
            ...{
                name: '',
                type: '',
                command: '',
                path: '',
                runsInRemote: false,
                proprietary: {}
            },
            ...(get(this.defaults, 'all', {})),
            ...(get(this.defaults, process.platform, {}))
        }
    }

    /**
     * Prepares the framework for sending out to renderer process.
     */
    public render (): FrameworkOptions {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            command: this.command,
            path: this.path,
            runsInRemote: this.runsInRemote,
            remotePath: this.remotePath,
            sshHost: this.sshHost,
            sshUser: this.sshUser,
            sshPort: this.sshPort,
            sshIdentity: this.sshIdentity,
            active: this.active,
            status: this.status,
            proprietary: this.proprietary,
            sort: this.getSort(),
            selected: this.getSelected().suites.length,
            canToggleTests: this.canToggleTests
        }
    }

    /**
     * Prepares the framework for persistence.
     */
    public persist (): FrameworkOptions {
        return omit({
            ...this.render(),
            suites: this.suites.map((suite: ISuite) => suite.persist())
        }, 'status', 'selective')
    }

    /**
     * Save this framework in the persistent store.
     */
    public save (): void {
        this.emit('save')
    }

    /**
     * Update this framework's options.
     *
     * @param options The new set of options to build the framework with.
     */
    public async updateOptions (options: FrameworkOptions): Promise<void> {
        const initChanged = options.command !== this.command ||
            this.runsInRemote !== options.runsInRemote ||
            this.sshHost !== options.sshHost ||
            this.repositoryPath !== options.repositoryPath

        // If framework doesn't run in remote, reset
        // SSH options, lest they linger inadvertently.
        if (!options.runsInRemote) {
            options.sshHost = ''
            options.sshUser = null
            options.sshPort = null
            options.sshIdentity = null
        }

        // Rebuild the options, except id (if not enforced) and suites.
        await this.build({
            ...options,
            ...{ id: options.id || this.id || uuid() }
        })

        if (initChanged) {
            // If framework initialization has changed, we need to remove the
            // existing suites and add them again, because their unique identifier
            // will potentially have changed (i.e. their absolute file path)
            this.reset()
            this.resetSuites()
            this.refresh()
        }

        this.emit('change', this)
    }

    /**
     * Get this framework's id.
     */
    public getId (): string {
        return this.id
    }

    /**
     * Get this framework's display name.
     */
    public getDisplayName (): string {
        return this.name
    }

    /**
     * Get this framework's remote path, if any, forcibly prefixing
     * it with a slash as they are used as root paths.
     */
    public getRemotePath (): string {
        return this.remotePath ? '/' + trimStart(this.remotePath, '/') : ''
    }

    /**
     * Get this framework's full remote path, if any, including the tests path.
     */
    public getFullRemotePath (): string {
        if (!this.getRemotePath()) {
            return ''
        }
        return Path.join(this.getRemotePath(), this.path)
    }

    /**
     * Update this framework's status.
     *
     * @param to The status we're updating to.
     */
    protected updateStatus (to?: FrameworkStatus): void {
        if (typeof to === 'undefined') {
            to = parseStatus(this.suites.map(suite => suite.getStatus()))
        }
        const from = this.status
        if (to !== from) {
            this.status = to
            this.emit('status', to, from)
            this.emitToRenderer(`${this.id}:status:sidebar`, to, from)
            this.emitToRenderer(`${this.id}:status:list`, to, from)
        }
    }

    /**
     * Run this framework's test suites, either fully or selectively.
     */
    protected async handleRun (): Promise<void> {
        await this.assemble()
        if (this.selective || this.hasFilters()) {
            return this.runSelective()
                .then(() => {
                    this.disassemble()
                })
                .catch(error => {
                    this.onError(error)
                })
        }
        return this.run()
            .then(() => {
                this.disassemble()
            })
            .catch(error => {
                this.onError(error)
            })
    }

    /**
     * Stop any processes that apply to this framework. This can include
     * running, refreshing or cancelling any queued jobs.
     */
    public async stop (): Promise<void> {
        // Returned promise is being chained and will always fulfill,
        // so we need to instantiate it with <void> on Typescript 4.1+
        return new Promise<void>((resolve, reject) => {
            // Before checking the actual process, clear the queue
            this.queue = {}

            // Prevent chained processes from being spawned by setting
            // the `killed` flag (i.e. running after a reload).
            this.killed = true

            // If process exists, kill it, otherwise resolve directly
            if (!this.process) {
                resolve()
                return
            }

            // Get the running process from the active process pool
            const running = pool.findProcess(this.process!)
            if (!running) {
                resolve()
                return
            }

            running!
                .on('killed', () => {
                    resolve()
                })
                .stop()
        })
            .then(() => {
                this.killed = false
                this.idleQueued()
                this.updateStatus()
                this.emit('change', this)
                log.debug(`Stopping ${this.name}`)
            })
            .catch(error => {
                this.killed = false
                this.onError(error)
            })
    }

    /**
     * Reset this framework's state.
     */
    public async reset (): Promise<any> {
        this.resetFilters()
    }

    /**
     * Whether this framework is running.
     */
    public isRunning (): boolean {
        return this.status === 'running'
    }

    /**
     * Whether this framework is refreshing.
     */
    public isRefreshing (): boolean {
        return this.status === 'refreshing'
    }

    /**
     * Whether this framework is busy.
     */
    public isBusy (): boolean {
        return this.isRunning() || this.isRefreshing() || this.status === 'queued'
    }

    /**
     * How many suites the framework currently has.
     */
    public count (): number {
        return this.suites.length
    }

    /**
     * Whether this framework has any suites.
     */
    public empty (): boolean {
        return this.count() === 0
    }

    /**
     * Run all suites inside this framework.
     */
    protected async run (): Promise<void> {
        this.rebuildStatusMap('queued')
        this.rebuildLedger()

        return new Promise((resolve, reject) => {
            this.updateStatus('running')
            this.reload()
                .then((outcome: string) => {
                    // Killed processes resolve the promise, so if user
                    // interrupted the run while reloading, make sure the
                    // run does not go ahead.
                    if (outcome === 'killed' || this.killed) {
                        log.debug(`Process was killed while reloading before run.`)
                        resolve()
                        return
                    }

                    // Re-queue suites and tests freshly added by the reload
                    // command. Note that Ledger will be rebuilt as part of
                    // the `afterRefresh` routine.
                    this.rebuildStatusMap('queued')
                    this.afterRefresh()

                    this.report(this.runArgs())
                        .then((outcome: string) => {
                            if (outcome !== 'killed') {
                                this.afterRun()
                            }
                            resolve()
                        }).catch(error => {
                            reject(error)
                        })
                })
                .catch(error => {
                    // Rejecting the Promise is enough to bubble the error
                    // up the chain, as we're already catching it on @handleRun
                    reject(error)
                })
        })
    }

    /**
     * Run this framework selectively (i.e. only run suites that have been
     * selected by the user).
     */
    protected async runSelective (): Promise<void> {
        const suites = this.selective ? this.selected.suites : this.getSuites()

        // If we're running filtered matches and all suites match, just
        // run the framework as normal, for performance reasons.
        if (!this.selective && suites.length === this.suites.length) {
            return this.run()
        }

        suites.forEach(suite => {
            suite.getNuggetIds(this.selective).forEach(id => {
                this.statuses[id] = 'queued'
            })
        })

        this.rebuildLedger()

        return new Promise((resolve, reject) => {
            this.updateStatus('running')
            // Chunk the selected suites so we can ensure we're never filtering
            // too many at a time (some frameworks will break if filtering
            // arguments are too long, like PHPUnit's, which passes them
            // straight into a `preg_match` call).
            chunk(this.sortSuites(suites), this.maxSelective).reduce((step, chunk) => {
                return step.then((outcome: string) => {
                    if (outcome === 'success') {
                        return this.report(this.runSelectiveArgs(chunk, this.selective))
                    }
                    return ''
                })
            }, Promise.resolve('success'))
                .then((outcome: string) => {
                    if (outcome !== 'killed') {
                        this.afterRun()
                    }
                    resolve()
                }).catch(error => {
                    reject(error)
                })
        })
    }

    /**
     * Refresh the list of suites inside this framework.
     */
    protected async handleRefresh (): Promise<void> {
        await this.assemble()
        this.updateStatus('refreshing')
        this.suites.forEach(suite => {
            suite.setFresh(false)
        })
        return this.reload()
            .then(outcome => {
                if (outcome !== 'killed') {
                    this.afterRefresh()
                    this.updateStatus()
                    this.emit('change', this)
                }
                this.disassemble()
            })
            .catch(error => {
                this.onError(error)
            })
    }

    /**
     * Run a report process. Reports are standardised processes that contain
     * encoded output that can be parsed by Lode in real-time. Report processes
     * will emit a `report` event every time a chunk has been successfully
     * parsed and is ready for debriefing.
     *
     * Report commands are wrapped in Promise calls and must receive `resolve`
     * and `reject` functions to standardise outcome resolution.
     *
     * @param args The arguments to run the report process with.
     */
    protected async report (args: Array<string>): Promise<string> {
        return new Promise((resolve, reject) => {
            this.spawn(args)
                .on('report', ({ report }) => {
                    this.progress()
                    try {
                        if (typeof report === 'string') {
                            throw Error('Report was malformed.')
                        }
                        this.running.push(this.debriefSuite(report))
                    } catch (error: any) {
                        this.emit('error', error)
                        this.emitToRenderer(`${this.id}:error`, error.toString(), this.troubleshoot(error))
                        log.error('Failed to debrief suite results.', error)
                    }
                })
                .on('success', () => {
                    Promise.all(this.running).then(() => {
                        resolve('success')
                    })
                })
                .on('killed', () => {
                    resolve('killed')
                })
                .on('error', error => {
                    reject(error)
                })
        })
    }

    /**
     * A function that runs after a framework has been refreshed.
     */
    protected afterRefresh (): void {
        this.cleanStaleSuites()
        // After a full refresh, emit tests from expanded nuggets recursively
        // to the renderer process.
        this.suites.filter(suite => suite.expanded)
            .forEach(suite => {
                suite.emitTestsToRenderer()
                suite.tests.filter(test => test.expanded)
                    .forEach(test => {
                        test.emitTestsToRenderer()
                    })
            })
    }

    /**
     * A function that runs after a framework has been run, either fully or
     * selectively.
     */
    protected afterRun (): void {
        // If a selected suite didn't run, mark their status as "error".
        if (this.selective) {
            this.selected.suites.forEach(suite => {
                suite.getNuggetIds(true).forEach(id => {
                    if (['queued', 'running'].indexOf(this.statuses[id]) > -1) {
                        this.statuses[id] = 'error'
                    }
                })
            })
        } else {
            // Suites which remain queued after a run are stale
            // and should be removed.
            let nuggets: Array<string> = []
            this.suites = this.suites.filter((suite: ISuite) => {
                if (suite.getStatus() === 'queued') {
                    this.onSuiteRemove(suite)
                    return false
                }
                nuggets = nuggets.concat(suite.getNuggetIds(false))
                return true
            })

            // Reset status when removing nuggets
            Object.keys(this.statuses)
                .filter(id => !nuggets.includes(id))
                .forEach(id => {
                    delete this.statuses[id]
                })

            this.emitSuitesToRenderer()
        }

        this.rebuildLedger()
        this.updateStatus()
        this.emit('change', this)
    }

    /**
     * Clean currently loaded suites that are not marked as "fresh".
     */
    protected cleanStaleSuites (): void {
        let nuggets: Array<string> = []
        this.suites = this.suites.filter((suite: ISuite) => {
            if (!suite.isFresh()) {
                this.onSuiteRemove(suite)
                return false
            }
            nuggets = nuggets.concat(suite.getNuggetIds(false))
            return true
        })

        // Reset status when removing nuggets
        Object.keys(this.statuses)
            .filter(id => !nuggets.includes(id))
            .forEach(id => {
                delete this.statuses[id]
            })

        this.emitSuitesToRenderer()
        this.rebuildLedger()
    }

    /**
     * Clean-up actions before removing a suite from this framework.
     *
     * @param suite The suite being removed.
     */
    protected onSuiteRemove (suite: ISuite): void {
        suite.removeAllListeners()
        this.updateSelected(suite)
    }

    /**
     * Handle errors in processing of framework.
     *
     * @param error The error to be handled
     */
    protected onError (error: Error): void {
        this.idleQueued()
        this.updateStatus('error')
        this.emit('error', error)
        this.emitToRenderer(`${this.id}:error`, error.toString(), this.troubleshoot(error))
        this.emit('change', this)
        this.disassemble()
    }

    /**
     * Reset all previously queued suites.
     */
    protected idleQueued (): void {
        const suites = this.selective ? this.selected.suites : this.suites
        suites.forEach(suite => {
            const nuggets = suite.getNuggetIds(this.selective)
            nuggets.shift()
            nuggets.forEach(id => {
                if (['queued', 'running'].indexOf(this.getNuggetStatus(id)) > -1) {
                    this.statuses[id] = 'idle'
                }
            })
            this.statuses[suite.getId()] = parseStatus(nuggets.map(id => this.getNuggetStatus(id)))
        })

        this.rebuildLedger()
    }

    /**
     * Spawn a new process. This will not spawn an arbitrary process; the
     * command with which to spawn the process with is fixed in the framework's
     * configurations and cannot be changed.
     *
     * @param args The arguments to spawn the process with.
     */
    protected spawn (args: Array<string>): IProcess {
        const process = ProcessFactory.make({
            command: this.command,
            args,
            path: this.repositoryPath,
            forceRunner: this.runner,
            ssh: !!this.sshHost,
            sshOptions: <SSHOptions>{
                host: this.sshHost,
                user: this.sshUser,
                port: this.sshPort,
                identity: this.sshIdentity,
                path: this.getRemotePath()
            }
        })

        this.process = process.getId()

        return process
    }

    /**
     * Hydrate the results of a suite run. This is a chance
     * for each framework to process content from their
     * respective reporters.
     *
     * @param partial The suite's run results
     */
    protected hydrateSuiteResult (partial: ISuiteResult): ISuiteResult {
        return partial
    }

    /**
     * The class of suite we use for this framework.
     */
    protected suiteClass (): typeof Suite {
        return Suite
    }

    /**
     * Instantiates a new suite using a result object.
     *
     * @param result The standardised suite results.
     */
    protected newSuite (result: ISuiteResult): ISuite {
        const SuiteClass = this.suiteClass()
        return new SuiteClass(this, result)
    }

    /**
     * Looks for a suite in the framework's already instantiated list of suites
     * using the filename for disambiguation and returns it.
     *
     * @param file The filename of the suite being searched.
     */
    protected findSuite (file: string): ISuite | undefined {
        return find(this.suites, { file })
    }

    /**
     * Returns an existing suite from this framework given a set of results,
     * or creates one and adds it to the framework.
     *
     * @param result An object representing a suite's test results.
     * @param rebuild Whether to rebuild the tests inside the suite, regardless of them being built already.
     */
    protected async makeSuite (result: ISuiteResult, rebuild = false): Promise<ISuite> {
        return new Promise(async (resolve, reject) => {
            let suite: ISuite | undefined = this.findSuite(result.file)

            if (!suite) {
                suite = this.newSuite(result)
                suite.on('selected', this.updateSelected.bind(this))
                this.suites.push(suite)
            } else if (rebuild) {
                await suite.rebuildTests(result)
            }

            // Mark suite as freshly made before returning,
            // in case we need to clear out stale ones.
            suite.setFresh(true)

            this.onSuiteReady()
            resolve(suite)
        })
    }

    /**
     * Clear the framework's suites.
     */
    protected resetSuites (): void {
        this.suites = []
        this.selected = {
            suites: []
        }
        this.selective = false
        this.rebuildStatusMap()
        this.rebuildLedger()
    }

    /**
     * Prepare the framework for ready state.
     */
    protected onReady (): void {
        // Ready event will only trigger once.
        if (this.ready) {
            return
        }

        this.ready = true
        this.updateStatus()
        this.emit('ready', this)
    }

    /**
     * Listener for when a child suite is ready.
     */
    protected onSuiteReady (): void {
        this.initialSuiteReady++
    }

    /**
     * Load a group of suites to this project on first instantiation.
     *
     * @param suites The suites to add to this project.
     */
    protected async loadSuites (suites: Array<ISuiteResult>): Promise<void> {
        return new Promise((resolve, reject) => {
            Promise.all(suites.map((result: ISuiteResult) => {
                // Hydrate results in case schema has changed from previously saved state
                return this.makeSuite(this.hydrateSuiteResult(result), true)
            })).then(() => {
                this.rebuildStatusMap()
                this.rebuildLedger()
                this.onReady()
                resolve()
            })
        })
    }

    /**
     * Whether a given file is contained inside this framework's path.
     *
     * @param file The path of the file being checked.
     */
    protected fileInPath (file: string): boolean {
        return file.startsWith(this.runsInRemote ? this.getRemotePath() : this.fullPath)
    }

    /**
     * Returns the portion of a path, if any, that is present in a given file path.
     *
     * @param path The full path whose presence we're trying to check
     * @param file The file which potentially holds a portion of the given path.
     */
    protected pathInFile (path: string, file: string): string {
        return trim(path, '/').split('/').reduce((found: string, directory: string) => {
            if (file.startsWith(found + directory + '/')) {
                found += directory + '/'
                return found
            }
            return ''
        }, '')
    }

    /**
     * Update the framework's array of selected suites.
     *
     * @param suite The suite which triggered this update.
     */
    protected updateSelected (suite: ISuite): void {
        const index = findIndex(this.selected.suites, selected => selected.getId() === suite.getId())
        if (suite.selected && index === -1) {
            this.selected.suites.push(suite)
        } else if (index > -1) {
            this.selected.suites.splice(index, 1)
        }

        this.selective = this.selected.suites.length > 0
        this.emitToRenderer(`${this.id}:selective`, this.selected.suites.length)
    }

    /**
     * Update the framework's ledger of suite statuses.
     *
     * @param to The new status of a suite inside this framework.
     * @param from The old status of a suite inside this framework, if any.
     */
    protected updateLedger (to: Status | null, from: Status): void {
        if (to) {
            this.ledger[to]!++
        }
        this.ledger[from]!--

        this.emitLedgerToRenderer()
    }

    /**
     * Rebuild the status ledger
     */
    protected rebuildLedger (): void {
        // Reset ledger before starting
        for (const key of Object.keys(this.ledger)) {
            this.ledger[<Status>key] = 0
        }

        // Iterate through suites and update each ledger status
        this.suites.forEach(suite => {
            this.ledger[suite.getStatus()]++
        })
        this.emitLedgerToRenderer()
    }

    /**
     * Return the framework's status ledger.
     */
    public getLedger (): StatusLedger {
        return this.ledger
    }

    /**
     * Rebuild the status map.
     */
    protected rebuildStatusMap (status: Status = 'idle'): void {
        this.statuses = {}
        this.suites.forEach((suite: ISuite) => {
            suite.getNuggetIds(false).forEach(id => {
                this.statuses[id] = status
            })
        })
    }

    /**
     * Return the framework's status map.
     */
    public getStatusMap (): StatusMap {
        return this.statuses
    }

    /**
     * Return the status of a nugget from this framework.
     */
    public getNuggetStatus (id: string): Status {
        return get(this.statuses, id, 'idle')
    }

    /**
     * Set the status of a nugget from this framework.
     */
    public setNuggetStatus (id: string, to: Status, from: Status, updateLedger: boolean): void {
        this.statuses[id] = to
        if (updateLedger) {
            this.updateLedger(to, from)
            return
        }
        this.emitLedgerToRenderer()
    }

    /**
     * Progress the ledger by one unit.
     */
    protected progress (): void {
        this.progressLedger.run++
        this.emit('progress')
    }

    /**
     * Prepare the progress ledger to measure a run of the given suites.
     *
     * @param suites The suites whose progress we're setting up to measure.
     */
    protected measureProgressForSuites (suites: Array<ISuite>): void {
        this.updateProgressLedger(0, this.calculateProgressTotalForSuites(suites))
        this.emit('measuring', this.progressLedger)
    }

    /**
     * Calculate the total amount we need to measure for progress for the given
     * suites. This is useful in case a particular frameworks needs to override
     * the calculation (i.e. measure progress in tests not suites).
     *
     * @param suites The suites whose progress we're setting up to measure.
     */
    protected calculateProgressTotalForSuites (suites: Array<ISuite>): number {
        return suites.length
    }

    /**
     * Update the framework's progress ledger.
     *
     * @param run The number of suites already run.
     * @param total The total number of suites to mark progress of.
     */
    protected updateProgressLedger (run: number, total?: number): void {
        this.progressLedger.run = run
        if (typeof total !== 'undefined') {
            this.progressLedger.total = total
        }
    }

    /**
     * Return the framework's progress ledger.
     */
    public getProgressLedger (): ProgressLedger {
        return this.progressLedger
    }

    /**
     * Reset the framework's progress ledger.
     */
    public resetProgressLedger (): void {
        this.updateProgressLedger(0, 0)
    }

    /**
     * Debrief a specific suite with the run's results.
     *
     * @param partial The suite's run results (potentially incomplete)
     */
    protected async debriefSuite (partial: ISuiteResult): Promise<void> {
        return new Promise((resolve, reject) => {
            const result: ISuiteResult = this.hydrateSuiteResult(partial)
            this.makeSuite(result).then((suite: ISuite) => {
                suite.debrief(result, this.shouldCleanup(suite)).then(() => {
                    resolve()
                })
            })
        })
    }

    /**
     * Whether the framework should clean the suite of obsolete tests
     * after debriefing.
     *
     * @param suite The test suite being checked for needing clean-up.
     */
    protected shouldCleanup (suite: ISuite): boolean {
        if (!this.selective) {
            return true
        }

        return suite.selected && !suite.partial
    }

    /**
     * Queue a run job with a unique id. This let's us cancel the job
     * if it's not yet executed simply by clearing the internal queue object.
     */
    public start (): void {
        // Only queue job if no other is queued or currently running
        if (this.isBusy() || Object.keys(this.queue).length > 0) {
            return
        }
        this.updateStatus('queued')
        const id = uuid()
        this.queue[id] = () => this.handleRun()
        queue.add(() => this.handleQueued(id))

        // Progress should be measured from a framework being queued,
        // rather than it actually being run.
        this.measureProgressForSuites(
            this.selective ? this.selected.suites : (this.hasFilters() ? this.getSuites() : this.suites)
        )
    }

    /**
     * Queue a `refresh` job with a unique id.
     * See @start for more info.
     */
    public refresh (): void {
        // Only queue job if no other is queued or currently running
        if (this.isBusy() || Object.keys(this.queue).length > 0) {
            return
        }
        this.updateStatus('queued')
        const id = uuid()
        this.queue[id] = () => this.handleRefresh()
        queue.add(() => this.handleQueued(id))
    }

    /**
     * Execute a queued job. This function is what actually gets pushed
     * to our global limiter and will only execute when concurrency allows.
     * If queue was cleared in the meantime, this function will still execute,
     * but will be empty of any logic and should be transparent to the user.
     *
     * @param id The unique id of the job to run.
     */
    protected handleQueued (id: string): Function {
        if (typeof this.queue[id] === 'undefined') {
            log.debug(`Queued job with id ${id} was cancelled before execution.`)
            return () => Promise.resolve()
        }
        log.debug(`Running queued job with id ${id}.`)

        // Pluck job from the queue before returning
        const job = this.queue[id]
        delete this.queue[id]
        return job()
    }

    /**
     * Set the active state of a framework.
     *
     * @param active The active state to set.
     */
    public setActive (active: boolean): void {
        this.active = active
        this.emit('change', this)
    }

    /**
     * Get the active state of a framework.
     */
    public isActive (): boolean {
        return this.active
    }

    /**
     * Whether the framework has any selected suites.
     */
    public isSelective (): boolean {
        return this.selective
    }

    /**
     * Get all the framework's suites in active sort order.
     */
    public getAllSuites (): Array<ISuite> {
        return this.sortSuites(this.suites)
    }

    /**
     * Get the framework's suites, considering active filters
     * and sort order.
     */
    public getSuites (): Array<ISuite> {
        if (!this.hasFilters()) {
            return this.getAllSuites()
        }

        const exact = this.filters.keyword && (this.filters.keyword as string).match(/^[\'\"].+[\'\"]$/g)
        const keyword = this.getFilterKeyword()
        return this.sortSuites(this.suites.filter((suite: ISuite) => {
            let match = true
            if (keyword) {
                if (exact) {
                    // Exact searches require filtering string to be contained
                    // within a suite's file path.
                    match = suite.getFilePath().toUpperCase().indexOf(keyword) > -1
                } else {
                    match = fuzzy(keyword, suite.getDisplayName().toUpperCase())
                }
            }
            if (this.filters.status) {
                // Only match if this hasn't been previously filtered out.
                match = match && !(
                    this.filters.status.indexOf(suite.getStatus()) === -1 &&
                    (this.filters.status.indexOf('selected') === -1 || !suite.selected) &&
                    // Don't exclude queued or running suites, otherwise running
                    // a matched status filter would automatically dissolve
                    // all matches once it starts.
                    ['queued', 'running'].indexOf(suite.getStatus()) === -1
                )
            }

            if (!match) {
                // If suite is to be excluded, de-select it and un-expand it.
                if (suite.selected) {
                    suite.toggleSelected(false, true)
                }

                return false
            }

            return true
        }))
    }

    /**
     * Get a suite from this framework by it's id (i.e. filename)
     *
     * @param id The unique id of the suite to get.
     */
    public getSuiteById (id: string): ISuite | undefined {
        const index = findIndex(this.suites, suite => suite.getId() === id)
        if (index > -1) {
            return this.suites[index]
        }
        return undefined
    }

    /**
     * Get the framework's selected suites.
     */
    public getSelected (): SuiteList {
        return this.selected
    }

    /**
     * Send current suites to renderer process.
     */
    public emitSuitesToRenderer (): void {
        this.emitToRenderer(
            `${this.id}:refreshed`,
            this.getSuites().map((suite: ISuite) => suite.render(false)),
            this.count()
        )
    }

    /**
     * Set a filter for this framework.
     */
    public setFilter (
        filter: FrameworkFilter,
        value: Array<string> | string | null
    ): void {
        this.filters[filter] = Array.isArray(value) ? (value.length ? value : null) : value
        this.emitSuitesToRenderer()
    }

    /**
     * Get the value of a framework filter.
     */
    public getFilter (filter: FrameworkFilter): Array<string> | string | null {
        return this.filters[filter]
    }

    /**
     * Whether the framework has any filters currently active.
     */
    public hasFilters (): boolean {
        return Object.values(this.filters).some(value => !!value)
    }

    /**
     * Reset all filters for this framework.
     */
    public resetFilters (): void {
        this.filters = {
            keyword: null,
            status: null,
            group: null
        }
        this.emitSuitesToRenderer()
    }

    /**
     * Get the relevant part of the current filter keyword (i.e. minus the
     * path sections not shown in the interface), and processed in a way that
     * that be processes by the filtering routine.
     */
    protected getFilterKeyword (): string | null {
        if (!this.filters.keyword) {
            return null
        }
        let keyword: string = trim((this.filters.keyword as string), `"'/\\`)

        // We're wilfully ignoring whether the framework runs in remote and
        // testing both cases at all times because if the framework does run
        // in a remote environment we still want to support users searching
        // using the local file's path.
        const remoteEmbeddedPath: string = this.pathInFile(this.getFullRemotePath(), keyword)
        const embeddedPath: string = this.pathInFile(this.fullPath, keyword)
        if (this.runsInRemote && remoteEmbeddedPath) {
            keyword = Path.relative(remoteEmbeddedPath, keyword)
        } else if (embeddedPath) {
            keyword = Path.relative(embeddedPath, keyword)
        }

        return keyword.toUpperCase()
    }

    /**
     * Get the current sort option for this framework.
     */
    protected getSort (): FrameworkSort {
        return (this.constructor as typeof Framework).sortDefault
    }

    /**
     * Sort suites by the framework's sorting option.
     *
     * @param suites The suites to sort
     */
    protected sortSuites (suites: Array<ISuite>): Array<ISuite> {
        return orderBy(
            suites,
            (suite: ISuite) => this.sortProperty(suite, this.sort),
            sortDirection(this.sort, false)
        )
    }

    /**
     * Get the sorting property of a given suite.
     *
     * @param suite The suites to get the property from.
     * @param sort The sorting option to enforce on the suite.
     */
    protected sortProperty (suite: ISuite, sort?: FrameworkSort): string | number | null {
        switch (sort) {
            case 'framework':
                return suite.getRunningOrder()
            case 'name':
                return suite.getDisplayName()
            default:
                return null
        }
    }

    /**
     * Validate framework specific options. This is meant to be overridden
     * by specific framework implementations (e.g. PHPUnit).
     */
    public static validate (validator: FrameworkValidator, options: any): void {
        // For generic framework validation see @lib/frameworks/validator.
    }

    /**
     * Provide setup instructions for using Lode with a testing framework.
     */
    public static instructions (): string {
        return ''
    }

    /**
     * Give the opportunity for frameworks to process test feedback text,
     * enriching the frameworks to make use of an HTML renderer.
     *
     * Supports markdown.
     *
     * @param text The feedback text to be processed by the framework.
     */
    public processFeedbackText (text: string): string {
        return text
    }

    /**
     * Give the opportunity for frameworks to troubleshoot certain errors in
     * processing, returning a helpful message for additional context. This will
     * be shown inside the alert, alongside the errors themselves.
     *
     * Frameworks extending this functionality should call super.troubleshoot()
     * as fallback, so we can still show the general troubleshooting advice
     * listed below.
     *
     * Supports markdown.
     *
     * @param error The error to be parsed for troubleshooting.
     */
    protected troubleshoot (error: Error | string): string {
        if (error instanceof Error) {
            error = error.toString()
        }

        if (error.includes('EACCES')) {
            return 'When running commands that connect into a remote machine instance, make sure all arguments needed to connect to the machine and running the test framework after doing so are present in the command itself. Using a batch script or storing SSH connection information in a file might be helpful or even required.'
        }

        if (error === '' && this.runsInRemote) {
            return 'Is the remote machine that runs the tests running?'
        }

        return ''
    }
}
