import { find } from 'lodash'
import { IProcess } from '@lib/process/process'
import { ProcessFactory } from '@lib/process/factory'
import { Suite, ISuite, ISuiteResult } from '@lib/frameworks/suite'
import { ITest } from '@lib/frameworks/test'
import { Status, parseStatus } from '@lib/frameworks/status'

export type FrameworkOptions = {
    command: string
    path: string
    runner?: string | null
    vmPath?: string | null
}

export interface IFramework {
    readonly command: string
    readonly path: string
    readonly runner: string | null
    process?: IProcess
    suites: Array<ISuite>
    status: Status

    run (): Promise<void>
    runSelective (suites: Array<ISuite>, tests: Array<ITest>): Promise<void>
    stop (): Promise<void>
    refresh (): Promise<Array<ISuite>>
}

export abstract class Framework implements IFramework {
    public readonly command: string
    public readonly path: string
    public readonly runner: string | null
    public readonly vmPath: string | null
    public process?: IProcess
    public suites: Array<ISuite> = []
    public running: Array<Promise<void>> = []
    public status: Status = 'idle'

    constructor (options: FrameworkOptions) {
        this.command = options.command
        this.path = options.path
        this.runner = options.runner || null
        this.vmPath = options.vmPath || null
    }

    abstract runArgs (): Array<string>
    abstract runSelectiveArgs (suites: Array<ISuite>, tests: Array<ITest>): Array<string>
    abstract refresh (): Promise<Array<ISuite>>

    report (args: Array<string>, resolve: Function, reject: Function): IProcess {
        return this.spawn(args)
            .on('report', ({ process, report }) => {
                console.log(report)
                this.running.push(this.debriefSuite(report))
            })
            .on('success', ({ process }) => {
                Promise.all(this.running).then(() => {
                    this.afterRun(true)
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

    run (): Promise<void> {
        this.suites.forEach(suite => {
            suite.reset()
        })
        return new Promise((resolve, reject) => {
            this.report(this.runArgs(), resolve, reject)
        })
    }

    runSelective (suites: Array<ISuite>, tests: Array<ITest>): Promise<void> {
        return new Promise((resolve, reject) => {
            this.report(this.runSelectiveArgs(suites, tests), resolve, reject)
        })
    }

    afterRun (cleanup: boolean = false) {
        console.log('cleaning up framework')
        if (cleanup) {
            this.suites = this.suites.filter(suite => suite.status !== 'idle')
        }
        this.status = parseStatus(this.suites.map(suite => suite.status))
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

    stop (): Promise<void> {
        return new Promise((resolve, reject) => {
            console.log('kill requested')
            if (!this.process) {
                console.log('no processs...')
                resolve()
            }
            this.process!
                .on('killed', () => {
                    resolve()
                })
                .stop()
        })
    }

    newSuite (file: string): ISuite {
        return new Suite(file, {
            path: this.path,
            vmPath: this.vmPath
        })
    }

    findSuite (file: string): ISuite | undefined {
        return find(this.suites, { file })
    }

    makeSuite (file: string): ISuite {
        let suite: ISuite | undefined = this.findSuite(file)
        if (!suite) {
            suite = this.newSuite(file)
            this.suites.push(suite)
        }
        return suite
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
        const suite: ISuite = this.makeSuite(result.file)
        return suite.debrief(result)
    }
}
