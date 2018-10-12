import { debounce, find } from 'lodash'
import { v4 as uuid } from 'uuid'
import { EventEmitter } from 'events'
import { IProcess } from '@lib/process/process'
import { ProcessFactory } from '@lib/process/factory'
import { Suite, ISuite, ISuiteResult } from '@lib/frameworks/suite'
import { FrameworkStatus, parseStatus } from '@lib/frameworks/status'

export type SelectedCount = {
    suites: number
    tests: number
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
    selected: boolean
    selectedCount: SelectedCount

    start (selective: boolean): Promise<void>
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
    public selected: boolean = false
    public selective: boolean = false
    public selectedCount: SelectedCount = {
        suites: 0,
        tests: 0
    }
    public updateCountsListener: any

    constructor (options: FrameworkOptions) {
        super()
        this.id = uuid()
        this.command = options.command
        this.path = options.path
        this.runner = options.runner || null
        this.vmPath = options.vmPath || null
        this.updateCountsListener = debounce(this.updateSelectedCounts.bind(this), 100)
    }

    abstract runArgs (): Array<string>
    abstract runSelectiveArgs (): Array<string>
    abstract reload (): Promise<void>

    start (selective: boolean = false): Promise<void> {
        if (selective) {
            console.log('Running selectively...')
            this.selective = true
            return this.runSelective()
                .catch((error) => {
                    console.log(error)
                    this.status = 'error'
                })
        }
        return this.run()
            .catch((error) => {
                console.log(error)
                this.status = 'error'
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
            this.status = 'stopped'
        })
        .catch(() => {
            this.status = 'error'
        })
    }

    run (): Promise<void> {
        this.suites.forEach(suite => {
            suite.reset()
        })
        return new Promise((resolve, reject) => {
            // @TODO: Framework configuration: always-refresh-before-running
            this.status = 'running'
            this.reload()
                .then(() => {
                    console.log('finished reloading from inside run', this)
                    this.report(this.runArgs(), resolve, reject)
                })
        })
    }

    runSelective (): Promise<void> {
        this.suites.filter(suite => suite.selected).forEach(suite => {
            suite.reset()
        })
        return new Promise((resolve, reject) => {
            this.status = 'running'
            this.report(this.runSelectiveArgs(), resolve, reject)
        })
    }

    refresh (): Promise<void> {
        this.status = 'refreshing'
        return this.reload()
            .then(suites => {
                this.status = 'idle'
            })
            .catch((error) => {
                console.log(error)
                this.status = 'error'
            })
    }

    report (args: Array<string>, resolve: Function, reject: Function): IProcess {
        return this.spawn(args)
            .on('report', ({ process, report }) => {
                this.running.push(this.debriefSuite(report))
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
        this.status = parseStatus(this.suites.map(suite => suite.status))
        this.selective = false
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
            suite.on('selective', this.updateCountsListener)
            this.suites.push(suite)
        }
        return suite
    }

    updateSelectedCounts (): void {
        this.selectedCount.tests = 0
        this.selectedCount.suites = this.suites.filter(suite => {
            this.selectedCount.tests += suite.tests.filter(test => test.selected).length
            return suite.selected
        }).length
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
        return suite.debrief(result, this.selective)
    }
}
