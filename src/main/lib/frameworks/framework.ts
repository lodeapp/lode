import * as Path from 'path'
import { find, findIndex, trimStart } from 'lodash'
import { v4 as uuid } from 'uuid'
import { EventEmitter } from 'events'
import { IProcess } from '@lib/process/process'
import { ProcessFactory } from '@lib/process/factory'
import { queue } from '@lib/process/queue'
import { ParsedRepository } from '@lib/frameworks/repository'
import { Suite, ISuite, ISuiteResult } from '@lib/frameworks/suite'
import { FrameworkStatus, Status, parseStatus } from '@lib/frameworks/status'
import { Logger } from '@lib/logger'
import pool from '@lib/process/pool'

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
    runsInVm?: boolean
    vmPath?: string
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
    runsInVm: boolean,
    vmPath: string | null
    runner: string | null
    process?: number
    suites: Array<ISuite>
    status: FrameworkStatus
    selective: boolean
    selected: SuiteList
    expandFilters: boolean
    queue: { [index: string]: Function }
    ledger: { [key in Status]: number }

    start (): void
    refresh (): void
    stop (): Promise<void>
    persist (): FrameworkOptions
    updateOptions (options: FrameworkOptions): void
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
    public vmPath!: string
    public runsInVm!: boolean
    public process?: number
    public suites: Array<ISuite> = []
    public running: Array<Promise<void>> = []
    public status: FrameworkStatus = 'idle'
    public selective: boolean = false
    public selected: SuiteList = {
        suites: []
    }
    public expandFilters: boolean = false
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
        this.runsInVm = options.runsInVm || false
        this.vmPath = options.vmPath || ''
        this.runner = options.runner || ''

        // If options include suites already (i.e. persisted state), add them.
        if (options.suites) {
            options.suites.forEach((result: ISuiteResult) => {
                this.makeSuite(result, true)
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
                runsInVm: false
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
            runsInVm: this.runsInVm,
            vmPath: this.vmPath,
            suites: this.suites.map(suite => suite.persist())
        }
    }

    /**
     * Update this framework's options.
     *
     * @param options The new set of options to build the framework with.
     */
    public updateOptions (options: FrameworkOptions): void {
        const initChanged = options.command !== this.command || this.runsInVm !== options.runsInVm
        const pathsChanged = this.runsInVm && options.vmPath !== this.vmPath || !this.runsInVm && options.path !== this.path

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
                    const suite = this.debriefSuite(report)
                    this.running.push(suite)
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
            .on('error', ({ message }) => {
                reject(message)
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
        const process = ProcessFactory.make(
            this.command,
            args,
            this.repositoryPath,
            this.runner
        )

        this.process = process.getId()

        return process
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
            path: this.fullPath,
            runsInVm: this.runsInVm,
            vmPath: this.vmPath
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
                path: this.fullPath,
                runsInVm: this.runsInVm,
                vmPath: this.vmPath
            })
        })
    }

    /**
     * Whether a given file is contained inside this framework's path.
     *
     * @param file The path of the file being checked.
     */
    protected fileInPath (file: string): boolean {
        return file.startsWith(this.vmPath || this.fullPath)
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
     * Decode the results of a suite run. This is a chance
     * for each framework to process content from their
     * respective reporters.
     *
     * @param result The suite's run results
     */
    protected decodeSuiteResult (result: ISuiteResult): ISuiteResult {
        return result
    }

    /**
     * Debrief a specific suite with the run's results.
     *
     * @param result The suite's run results
     */
    protected debriefSuite (result: ISuiteResult): Promise<void> {
        result = this.decodeSuiteResult(result)
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
        return this.queue[id]()
    }

    /**
     * Give the opportunity for frameworks to troubleshoot certain errors in
     * processing, returning a helpful message for additional context. This will
     * be shown inside the alert, alongside the errors themselves.
     *
     * Supports markdown.
     *
     * @param error The error to be parsed for troubleshooting.
     */
    protected troubleshoot (error: Error | string): string {
        return ''
    }
}
