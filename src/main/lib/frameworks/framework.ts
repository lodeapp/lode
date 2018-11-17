import { find, findIndex } from 'lodash'
import { v4 as uuid } from 'uuid'
import { EventEmitter } from 'events'
import { IProcess } from '@lib/process/process'
import { ProcessFactory } from '@lib/process/factory'
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
    command: string
    path: string
    runner?: string | null
    vmPath?: string | null
}

/**
 * The Framework interface.
 */
export interface IFramework extends EventEmitter {
    readonly id: string
    readonly command: string
    readonly path: string
    readonly runner: string | null
    process?: number
    suites: Array<ISuite>
    status: FrameworkStatus
    selective: boolean
    selected: SuiteList
    expandFilters: boolean
    queue: { [index: string]: Function }
    ledger: { [key in Status]: number }

    start (): Promise<void>
    stop (): Promise<void>
    refresh (): Promise<void>
}

/**
 * The Framework class represents a testing framework (e.g. Jest, PHPUnit)
 * and contains a set of test suites (files).
 */
export abstract class Framework extends EventEmitter implements IFramework {
    public readonly id: string
    public readonly command: string
    public readonly path: string
    public readonly runner: string | null
    public readonly vmPath: string | null
    public readonly runsInVm: boolean
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
        passed: 0,
        failed: 0,
        incomplete: 0,
        skipped: 0,
        warning: 0,
        partial: 0,
        empty: 0,
        idle: 0
    }

    constructor (options: FrameworkOptions) {
        super()
        this.id = uuid()
        this.command = options.command
        this.path = options.path
        this.runner = options.runner || null
        this.vmPath = options.vmPath || null
        this.runsInVm = !!this.vmPath
    }

    abstract runArgs (): Array<string>
    abstract runSelectiveArgs (): Array<string>
    abstract reload (): Promise<string>

    /**
     * Update this framework's status.
     */
    updateStatus (to: FrameworkStatus): void {
        const from = this.status
        this.status = to
        this.emit('status', to, from)
    }

    /**
     * Run this framework's test suites, either fully or selectively.
     */
    start (): Promise<void> {
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
    stop (): Promise<void> {
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
            this.suites.forEach(suite => {
                if (suite.status === 'queued') {
                    suite.reset(false)
                }
            })
            this.updateStatus(parseStatus(this.suites.map(suite => suite.status)))
        })
        .catch(error => {
            this.onError(error)
        })
    }

    /**
     * Run all suites inside this framework.
     */
    run (): Promise<void> {
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

                        this.suites.forEach(suite => {
                            suite.queue(false)
                        })
                        this.report(this.runArgs(), resolve, reject)
                    })
                    .catch(error => {
                        // Rejecting the Promise is enough to bubble up the
                        // error chain, as we're already catching it on @start
                        reject(error)
                    })
            })
        })
    }

    /**
     * Run this framework selectively (i.e. only run suites that have been
     * selected by the user).
     */
    runSelective (): Promise<void> {
        this.selected.suites.forEach(suite => {
            suite.queue(true)
        })
        return new Promise((resolve, reject) => {
            this.updateStatus('running')
            // See @run
            process.nextTick(() => {
                this.report(this.runSelectiveArgs(), resolve, reject)
            })
        })
    }

    /**
     * Refresh the list of suites inside this framework.
     */
    refresh (): Promise<void> {
        this.updateStatus('refreshing')
        return this.reload()
            .then(() => {
                this.updateStatus('idle')
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
    report (
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
    afterRun () {
        if (!this.selective) {
            this.suites = this.suites.filter(suite => suite.status !== 'idle')
        }
        this.updateStatus(parseStatus(this.suites.map(suite => suite.status)))
    }

    /**
     * Handle errors in processing of framework.
     *
     * @param message The error message
     */
    onError (message: string) {
        this.updateStatus('error')
        this.emit('error', message)
    }

    /**
     * Spawn a new process. This will not spawn an arbitrary process; the
     * command with which to spawn the process with is fixed in the framework's
     * configurations and cannot be changed.
     *
     * @param args The arguments to spawn the process with.
     */
    spawn (args: Array<string>): IProcess {
        const process = ProcessFactory.make(
            this.command,
            args,
            this.path,
            this.runner
        )

        this.process = process.getId()

        return process
    }

    /**
     * Instantiates a new suite using a result object.
     *
     * @param result The standardised suite results.
     */
    newSuite (result: ISuiteResult): ISuite {
        return new Suite({
            path: this.path,
            vmPath: this.vmPath
        }, result)
    }

    /**
     * Looks for a suite in the framework's already instantiated list of suites
     * using the filename for disambiguation and returns it.
     *
     * @param file The filename of the suite being searched.
     */
    findSuite (file: string): ISuite | undefined {
        return find(this.suites, { file })
    }

    /**
     * Returns an existing suite from this framework given a set of results,
     * or creates one and adds it to the framework.
     *
     * @param result An object representing a suite's test results.
     */
    makeSuite (result: ISuiteResult): ISuite {
        let suite: ISuite | undefined = this.findSuite(result.file)
        if (!suite) {
            suite = this.newSuite(result)
            suite.on('selective', this.updateSelected.bind(this))
            suite.on('status', this.updateLedger.bind(this))
            this.updateLedger(suite.status)
            this.suites.push(suite)
        }
        return suite
    }

    /**
     * Whether a given file is contained inside this framework's path.
     *
     * @param file The path of the file being checked.
     */
    fileInPath (file: string): boolean {
        return file.startsWith(this.vmPath || this.path)
    }

    /**
     * Update the framework's array of selected suites.
     *
     * @param suite The suite which triggered this update.
     */
    updateSelected (suite: ISuite): void {
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
    updateLedger (to: Status | null, from?: Status): void {
        if (to) {
            this.ledger[to]!++
        }
        if (from) {
            this.ledger[from]!--
        }
    }

    /**
     * Decode the results of a suite run. This is a chance
     * for each framework to process content from their
     * respective reporters.
     *
     * @param result The suite's run results
     */
    decodeSuiteResult (result: ISuiteResult): ISuiteResult {
        return result
    }

    /**
     * Debrief a specific suite with the run's results.
     *
     * @param result The suite's run results
     */
    debriefSuite (result: ISuiteResult): Promise<void> {
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
    shouldCleanup(suite: ISuite): boolean {
        if (!this.selective) {
            return true
        }

        return suite.selected && !suite.partial
    }

    /**
     * Queue a `start` job with a unique id. This let's us cancel the job
     * if it's not yet executed simply by clearing the internal queue object.
     */
    queueStart (): Function {
        this.updateStatus('queued')
        const id = uuid()
        this.queue[id] = () => this.start()
        return () => this.runQueued(id)
    }

    /**
     * Queue a `refresh` job with a unique id.
     * See @queueStart for more info.
     */
    queueRefresh (): Function {
        this.updateStatus('queued')
        const id = uuid()
        this.queue[id] = () => this.refresh()
        return () => this.runQueued(id)
    }

    /**
     * Execute a queued job. This function is what actually gets pushed
     * to our global limiter and will only execute when concurrency allows.
     * If queue was cleared in the meantime, this function will still execute,
     * but will be empty of any logic and should be transparent to the user.
     *
     * @param id The unique id of the job to run.
     */
    runQueued (id: string): Function {
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
    troubleshoot (error: Error | string): string {
        return ''
    }
}
