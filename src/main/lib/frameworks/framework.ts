import { find, findIndex } from 'lodash'
import { v4 as uuid } from 'uuid'
import { EventEmitter } from 'events'
import { IProcess } from '@lib/process/process'
import { ProcessFactory } from '@lib/process/factory'
import { Suite, ISuite, ISuiteResult } from '@lib/frameworks/suite'
import { FrameworkStatus, Status, parseStatus } from '@lib/frameworks/status'
import { Logger } from '@lib/logger'

export type SelectedCache = {
    suites: Array<ISuite>
}

export type FrameworkOptions = {
    command: string
    path: string
    runner?: string | null
    vmPath?: string | null
}

export interface IFramework extends EventEmitter {
    readonly id: string
    readonly command: string
    readonly path: string
    readonly runner: string | null
    process?: IProcess
    suites: Array<ISuite>
    status: FrameworkStatus
    selective: boolean
    selected: SelectedCache
    expandFilters: boolean
    ledger: { [key in Status]: number }

    start (): Promise<void>
    stop (): Promise<void>
    refresh (): Promise<void>
}

export abstract class Framework extends EventEmitter implements IFramework {
    public readonly id: string
    public readonly command: string
    public readonly path: string
    public readonly runner: string | null
    public readonly vmPath: string | null
    public process?: IProcess
    public suites: Array<ISuite> = []
    public running: Array<Promise<void>> = []
    public status: FrameworkStatus = 'idle'
    public selective: boolean = false
    public selected: SelectedCache = {
        suites: []
    }
    public expandFilters: boolean = false
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
    }

    abstract runArgs (): Array<string>
    abstract runSelectiveArgs (): Array<string>
    abstract reload (): Promise<void>

    updateStatus (to: FrameworkStatus): void {
        const from = this.status
        this.status = to
        this.emit('status', to, from)
    }

    start (): Promise<void> {
        if (this.selective) {
            return this.runSelective()
                .catch((error) => {
                    this.updateStatus('error')
                })
        }
        return this.run()
            .catch((error) => {
                this.updateStatus('error')
            })
    }

    stop (): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.process) {
                resolve()
            }
            this.process!
                .on('killed', () => {
                    resolve()
                })
                .stop()
        })
        .then(() => {
            this.updateStatus('stopped')
            this.suites.forEach(suite => {
                if (suite.status === 'queued') {
                    suite.reset(false)
                }
            })
        })
        .catch(() => {
            this.updateStatus('error')
        })
    }

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
                    .then(() => {
                        this.suites.forEach(suite => {
                            suite.queue(false)
                        })
                        this.report(this.runArgs(), resolve, reject)
                    })
            })
        })
    }

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

    refresh (): Promise<void> {
        this.updateStatus('refreshing')
        return this.reload()
            .then(() => {
                this.updateStatus('idle')
            })
            .catch((error) => {
                console.log(error)
                this.updateStatus('error')
            })
    }

    report (args: Array<string>, resolve: Function, reject: Function): IProcess {
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

    afterRun () {
        if (!this.selective) {
            console.log('Cleaning up framework')
            this.suites = this.suites.filter(suite => suite.status !== 'idle')
        }
        this.updateStatus(parseStatus(this.suites.map(suite => suite.status)))
    }

    spawn (args: Array<string>): IProcess {
        this.process = ProcessFactory.make(
            this.command,
            args,
            this.path,
            this.runner
        )

        return this.process
    }

    newSuite (result: ISuiteResult): ISuite {
        return new Suite({
            path: this.path,
            vmPath: this.vmPath
        }, result)
    }

    findSuite (file: string): ISuite | undefined {
        return find(this.suites, { file })
    }

    makeSuite (
        result: ISuiteResult,
        force: boolean = false
    ): ISuite {
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

    fileInPath (file: string): boolean {
        return file.startsWith(this.vmPath || this.path)
    }

    updateSelected (suite: ISuite): void {
        const index = findIndex(this.selected.suites, { 'id': suite.id })
        if (suite.selected && index === -1) {
            this.selected.suites.push(suite)
        } else if (index > -1) {
            this.selected.suites.splice(index, 1)
        }

        this.selective = this.selected.suites.length > 0
    }

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

    shouldCleanup(suite: ISuite): boolean {
        if (!this.selective) {
            return true
        }

        return suite.selected && !suite.partial
    }
}
