import * as Path from 'path'
import { find, findIndex, merge, trimStart } from 'lodash'
import { v4 as uuid } from 'uuid'
import { EventEmitter } from 'events'
import { IProcess } from '@main/lib/process/process'
import { ProcessFactory } from '@main/lib/process/factory'
import { queue } from '@main/lib/process/queue'
import { ParsedRepository } from '@main/lib/frameworks/repository'
import { Suite, ISuite, ISuiteResult } from '@main/lib/frameworks/suite'
import { FrameworkStatus, Status, parseStatus } from '@main/lib/frameworks/status'
import { SSHOptions } from '@main/lib/process/ssh'
import { Logger } from '@main/lib/logger'
import pool from '@main/lib/process/pool'

/**
 * A list of test suites.
 */
export type SuiteList = {
    suites: Array<ISuite>
}

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
    collapsed?: boolean
    expandFilters?: boolean
    suites?: Array<ISuiteResult>
    scanStatus?: 'pending' | 'removed'
}

/**
 * The Framework interface.
 */
export interface IFramework extends EventEmitter {
    id: string
    name: string
    type: string
    command: string
    path: string
    repositoryPath: string
    fullPath: string
    runsInRemote: boolean,
    remotePath: string | null
    sshHost: string
    sshUser: string | null
    sshPort: number | null
    sshIdentity: string | null
    runner: string | null
    process?: number
    suites: Array<ISuite>
    status: FrameworkStatus
    selective: boolean
    selected: SuiteList
    collapsed: boolean
    expandFilters: boolean
    queue: { [index: string]: Function }
    ledger: { [key in Status]: number }

    start (): void
    refresh (): void
    stop (): Promise<void>
    isRunning (): boolean
    isRrefreshing (): boolean
    isBusy (): boolean
    persist (): FrameworkOptions
    updateOptions (options: FrameworkOptions): void
    getDisplayName (): string
    toggle (): void
    toggleFilters (): void
}

/**
 * The Framework class represents a testing framework (e.g. Jest, PHPUnit)
 * and contains a set of test suites (files).
 */
export abstract class Framework extends EventEmitter implements IFramework {
    public id!: string
    public name!: string
    public type!: string
    public command!: string
    public path!: string
    public repositoryPath!: string
    public fullPath!: string
    public runner!: string | null
    public remotePath!: string
    public runsInRemote!: boolean
    public sshHost!: string
    public sshUser!: string | null
    public sshPort!: number | null
    public sshIdentity!: string | null
    public process?: number
    public suites: Array<ISuite> = []
    public running: Array<Promise<void>> = []
    public status: FrameworkStatus = 'idle'
    public selective: boolean = false
    public selected: SuiteList = {
        suites: []
    }
    public collapsed!: boolean
    public expandFilters!: boolean
    public queue: { [index: string]: Function } = {}
    public ledger: { [key in Status]: number } = {
        queued: 0,
        running: 0,
        passed: 0,
        failed: 0,
        incomplete: 0,
        skipped: 0,
        warning: 0,
        partial: 0,
        empty: 0,
        idle: 0
    }

    protected version?: string

    static readonly defaults?: FrameworkOptions

    constructor (options: FrameworkOptions) {
        super()
        this.build(options)
    }

    /**
     * Build the framework from the given options. This is essentially
     * the constructor, but it's abstracted so we can rebuild the object
     * in case the options are updated at runtime.
     *
     * @param options The options to build the framework with.
     */
    protected build (options: FrameworkOptions) {

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

        this.collapsed = options.collapsed || false
        this.expandFilters = options.expandFilters || false

        // If options include suites already (i.e. persisted state), add them.
        if (options.suites) {
            options.suites.forEach((result: object) => {
                // Hydrate results in case schema has changed from previously saved state
                this.makeSuite(this.hydrateSuiteResult(result), true)
            })
        }
    }

    /**
     * The command arguments for running this framework.
     */
    protected abstract runArgs (): Array<string>

    /**
     * The command arguments for running this framework selectively.
     */
    protected abstract runSelectiveArgs (): Array<string>

    /**
     * Reload this framework's suites and tests.
     */
    protected abstract reload (): Promise<string>

    /**
     * Test the given files for framework existence and return appropriate
     * instantiation options, if applicable.
     *
     * Must be implemented by the frameworks themselves. It should be considered
     * an abstract method, but Typescript doesn't support abstract static methods.
     *
     * @param repository The parsed repository to test.
     */
    public static spawnForDirectory (repository: ParsedRepository): FrameworkOptions | false {
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
                runsInRemote: false
            },
            ...(this.defaults || {})
        }
        return {
            ...defaults,
            ...options
        }
    }

    /**
     * Prepares the framework for persistence.
     */
    public persist (): FrameworkOptions {
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
            collapsed: this.collapsed,
            expandFilters: this.expandFilters,
            suites: this.suites.map(suite => suite.persist())
        }
    }

    /**
     * Update this framework's options.
     *
     * @param options The new set of options to build the framework with.
     */
    public updateOptions (options: FrameworkOptions): void {
        const initChanged = options.command !== this.command
            || this.runsInRemote !== options.runsInRemote
            || this.sshHost !== options.sshHost

        const pathsChanged = options.path !== this.path || (this.runsInRemote && options.remotePath !== this.remotePath)

        // If framework doesn't run in remote, reset
        // SSH options, lest they linger inadvertently.
        if (!options.runsInRemote) {
            options.sshHost = ''
            options.sshUser = null
            options.sshPort = null
            options.sshIdentity = null
        }

        // Rebuild the options, except id if not enforced
        this.build({ ...options, ...{ id: options.id || this.id || uuid() }})

        if (initChanged) {
            // If framework initialization has changed, we need to remove the
            // existing suites and add them again, because their unique identifier
            // will potentially have changed (i.e. their absolute file path)
            this.resetSuites()
            this.refresh()
        } else if (pathsChanged) {
            // Else if only framework paths have changed, we'll refresh just
            // the underlying suites to update their relative paths.
            this.refreshSuites()
        }

        this.emit('change', this)
    }

    /**
     * Get this framework's display name.
     */
    public getDisplayName (): string {
        return this.name
    }

    /**
     * Get this framework's version, if set.
     */
    public getVersion (): string | undefined {
        return this.version
    }

    /**
     * Toggle this framework's visibility.
     */
    public toggle (): void {
        this.collapsed = !this.collapsed
        this.emit('change', this)
    }

    /**
     * Toggle this framework's filters visibility.
     */
    public toggleFilters (): void {
        this.expandFilters = !this.expandFilters
        this.emit('change', this)
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
        this.status = to
        this.emit('status', to, from)
    }

    /**
     * Run this framework's test suites, either fully or selectively.
     */
    protected handleRun (): Promise<void> {
        if (this.selective) {
            return this.runSelective()
                .catch(error => {
                    this.onError(error)
                })
        }
        return this.run()
            .catch(error => {
                this.onError(error)
            })
    }

    /**
     * Stop any processes that apply to this framework. This can include
     * running, refreshing or cancelling any queued jobs.
     */
    public stop (): Promise<void> {
        return new Promise((resolve, reject) => {
            // Before checking the actual process, clear the queue
            this.queue = {}

            // If process exists, kill it, otherwise resolve directly
            if (!this.process) {
                resolve()
            }

            // Get the running process from the active process pool
            const running = pool.findProcess(this.process!)
            if (!running) {
                resolve()
            }

            running!
                .on('killed', () => {
                    resolve()
                })
                .stop()
        })
        .then(() => {
            this.resetQueued()
            this.updateStatus()
            this.emit('change', this)
        })
        .catch(error => {
            this.onError(error)
        })
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
    public isRrefreshing (): boolean {
        return this.status === 'refreshing'
    }

    /**
     * Whether this framework is busy.
     */
    public isBusy (): boolean {
        return this.isRunning() || this.isRrefreshing()
    }

    /**
     * Run all suites inside this framework.
     */
    protected run (): Promise<void> {
        this.suites.forEach(suite => {
            suite.queue(false)
        })
        return new Promise((resolve, reject) => {
            this.updateStatus('running')
            // Only start the actual running process on next tick. This allows
            // the renderer to redraw the app state, thus appearing snappier.
            process.nextTick(() => {
                this.reload()
                    .then((outcome: string) => {
                        // Killed processes resolve the promise, so if user
                        // interrupted the run while reloading, make sure the
                        // run does not go ahead.
                        if (outcome === 'killed') {
                            Logger.debug.log(`Process was killed while reloading before run.`)
                            resolve()
                            return
                        }

                        this.cleanStaleSuites()
                        this.suites.forEach(suite => {
                            suite.queue(false)
                        })
                        this.report(this.runArgs(), resolve, reject)
                    })
                    .catch(error => {
                        // Rejecting the Promise is enough to bubble the error
                        // up the chain, as we're already catching it on @handleRun
                        reject(error)
                    })
            })
        })
    }

    /**
     * Run this framework selectively (i.e. only run suites that have been
     * selected by the user).
     */
    protected runSelective (): Promise<void> {
        this.selected.suites.forEach(suite => {
            suite.queue(true)
        })
        return new Promise((resolve, reject) => {
            this.updateStatus('running')
            // See @run for reasoning behind `nextTick`
            process.nextTick(() => {
                this.report(this.runSelectiveArgs(), resolve, reject)
            })
        })
    }

    /**
     * Refresh the list of suites inside this framework.
     */
    protected handleRefresh (): Promise<void> {
        this.updateStatus('refreshing')
        return this.reload()
            .then(() => {
                this.cleanStaleSuites()
                this.updateStatus()
                this.emit('change', this)
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
     * @param resolve The wrapper Promise's resolve function
     * @param reject The wrapper Promise's reject function
     */
    protected report (
        args: Array<string>,
        resolve: Function,
        reject: Function
    ): IProcess {
        return this.spawn(args)
            .on('report', ({ process, report }) => {
                try {
                    this.running.push(this.debriefSuite(report))
                } catch (error) {
                    // @TODO: Notify user of error (i.e. add to alert stack)
                    Logger.info.log('Failed to debrief suite results.', { report })
                }
            })
            .on('success', ({ process }) => {
                Promise.all(this.running).then(() => {
                    this.afterRun()
                    resolve()
                })
            })
            .on('killed', ({ process }) => {
                resolve()
            })
            .on('error', error => {
                reject(error)
            })
    }

    /**
     * A function that runs after a framework has been run, either fully or
     * selectively.
     */
    protected afterRun () {
        // Suites which remain queued after a run are stale
        // and should be removed.
        this.cleanSuitesByStatus('queued')
        this.updateStatus()
        this.emit('change', this)
    }

    /**
     * Clean currently loaded suites by a given status.
     *
     * @param status The status by which to clean the suites.
     */
    protected cleanSuitesByStatus (status: Status): void {
        this.suites = this.suites.filter(suite => {
            if (suite.getStatus() === status) {
                this.updateLedger(null, status)
                return false
            }
            return true
        })
    }

    /**
     * Clean currently loaded suites that are not marked as "fresh".
     */
    protected cleanStaleSuites (): void {
        this.suites = this.suites.filter(suite => {
            if (!suite.fresh) {
                this.updateLedger(null, suite.getStatus())
                return false
            }
            // After checking, reset "freshness" marker.
            suite.fresh = false
            return true
        })
    }

    /**
     * Handle errors in processing of framework.
     *
     * @param message The error message
     */
    protected onError (message: string): void {
        this.resetQueued()
        this.updateStatus('error')
        this.emit('error', message)
        this.emit('change', this)
    }

    /**
     * Reset all previously queued suites.
     */
    protected resetQueued (): void {
        this.suites.forEach(suite => {
            suite.resetQueued()
        })
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
                path: this.remotePath
            }
        })

        this.process = process.getId()

        return process
    }

    /**
     * Create a full suite result object from a potentially incomplete one.
     *
     * @param partial The potentially incomplete result object.
     */
    protected hydrateSuiteResult (partial: object): ISuiteResult {
        return merge(
            // If a specific version was passed, inject it in the result.
            // This is useful for frameworks cannot pass versions from results,
            // but its framework class can figure out the version via command.
            this.getVersion() ? { version: this.getVersion() } : {},
            {
                file: '',
                tests: [],
                meta: [],
                testsLoaded: true
            },
            this.decodeSuiteResult(partial)
        )
    }

    /**
     * Decode the results of a suite run. This is a chance
     * for each framework to process content from their
     * respective reporters.
     *
     * @param partial The suite's run results (potentially incomplete)
     */
    protected decodeSuiteResult (partial: object): object {
        return partial
    }

    /**
     * The class of suite we use for this framework.
     */
    protected suiteClass(): typeof Suite {
        return Suite
    }

    /**
     * Instantiates a new suite using a result object.
     *
     * @param result The standardised suite results.
     */
    protected newSuite (result: ISuiteResult): ISuite {
        const suiteClass = this.suiteClass()
        return new suiteClass({
            path: this.path,
            root: this.fullPath,
            runsInRemote: this.runsInRemote,
            remotePath: this.remotePath
        }, result)
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
    protected makeSuite (
        result: ISuiteResult,
        rebuild: boolean = false
    ): ISuite {
        let suite: ISuite | undefined = this.findSuite(result.file)
        if (!suite) {
            suite = this.newSuite(result)
            suite.on('selective', this.updateSelected.bind(this))
            suite.on('status', this.updateLedger.bind(this))
            this.updateLedger(suite.getStatus())
            this.suites.push(suite)
        }
        // Mark suite as freshly made before returning,
        // in case we need to clear out stale ones.
        suite.fresh = true
        if (rebuild) {
            suite.buildTests(result, false)
        }
        return suite
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
        this.resetLedger()
    }

    /**
     * Refresh the framework's suites with new instantiation options.
     */
    protected refreshSuites (): void {
        this.suites.forEach(suite => {
            suite.refresh({
                path: this.path,
                root: this.fullPath,
                runsInRemote: this.runsInRemote,
                remotePath: this.remotePath
            })
        })
    }

    /**
     * Whether a given file is contained inside this framework's path.
     *
     * @param file The path of the file being checked.
     */
    protected fileInPath (file: string): boolean {
        return file.startsWith(this.remotePath || this.fullPath)
    }

    /**
     * Update the framework's array of selected suites.
     *
     * @param suite The suite which triggered this update.
     */
    protected updateSelected (suite: ISuite): void {
        const index = findIndex(this.selected.suites, { 'id': suite.id })
        if (suite.selected && index === -1) {
            this.selected.suites.push(suite)
        } else if (index > -1) {
            this.selected.suites.splice(index, 1)
        }

        this.selective = this.selected.suites.length > 0
    }

    /**
     * Update the framework's ledger of suite statuses.
     *
     * @param to The new status of a suite inside this framework.
     * @param from The old status of a suite inside this framework, if any.
     */
    protected updateLedger (to: Status | null, from?: Status): void {
        if (to) {
            this.ledger[to]!++
        }
        if (from) {
            this.ledger[from]!--
        }
    }

    /**
     * Reset the framework's ledger to its initial value.
     */
    protected resetLedger (): void {
        for (let key of Object.keys(this.ledger)) {
            this.ledger[<Status>key] = 0
        }
    }

    /**
     * Debrief a specific suite with the run's results.
     *
     * @param partial The suite's run results (potentially incomplete)
     */
    protected debriefSuite (partial: object): Promise<void> {
        const result: ISuiteResult = this.hydrateSuiteResult(partial)
        const suite: ISuite = this.makeSuite(result)
        return suite.debrief(result, this.shouldCleanup(suite))
    }

    /**
     * Whether the framework should clean the suite of obsolete tests
     * after debriefing.
     *
     * @param suite The test suite being checked for needing clean-up.
     */
    protected shouldCleanup(suite: ISuite): boolean {
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
            Logger.debug.log(`Queued job with id ${id} was cancelled before execution.`)
            return () => Promise.resolve()
        }
        Logger.debug.log(`Running queued job with id ${id}.`)

        // Pluck job from the queue before returning
        const job = this.queue[id]
        delete this.queue[id]
        return job()
    }

    /**
     * Provide setup instructions for using Lode with a testing framework.
     */
    public static instructions (): string {
        return ''
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
