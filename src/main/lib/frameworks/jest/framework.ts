import * as Path from 'path'
import { FrameworkOptions, Framework } from '@lib/frameworks/framework'
import { Suite } from '@lib/frameworks/suite'

export class Jest extends Framework {
    readonly name = 'Jest'

    constructor (options: FrameworkOptions) {
        super(options)
    }

    /**
     * Reload this framework's suites and tests.
     */
    protected reload (): Promise<string> {
        return new Promise((resolve, reject) => {
            this.spawn(['--listTests', '--forceExit'])
                .on('success', ({ process }) => {
                    const lines = process.getLines()
                    lines.sort()
                    lines.filter((file: string) => this.fileInPath(file))
                        .map((file: string) => this.makeSuite(Suite.buildResult({
                            file,
                            testsLoaded: false
                        })))
                    resolve('success')
                })
                .on('killed', ({ process }) => {
                    resolve('killed')
                })
                .on('error', ({ message }) => {
                    reject(message)
                })
        })
    }

    /**
     * The command arguments for running this framework.
     */
    protected runArgs (): Array<string> {
        return [
            '--forceExit',
            '--expand',
            '--colors',
            '--reporters',
            this.runsInVm ? 'jest-lode' : Path.resolve(__dirname, '../../bridge/jest/reporter.js')
        ]
    }

    /**
     * The command arguments for running this framework selectively.
     */
    protected runSelectiveArgs (): Array<string> {
        const args: Array<string> = []

        this.suites.filter(suite => suite.selected).forEach(suite => {
            args.push(suite.relative)
        })

        return args.concat(this.runArgs())
    }
}
