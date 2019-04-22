import * as Path from 'path'
import * as Fs from 'fs-extra'
import { get } from 'lodash'
import { unpacked } from '@lib/helpers'
import { ParsedRepository } from '@lib/frameworks/repository'
import { FrameworkOptions, Framework } from '@lib/frameworks/framework'

export class Jest extends Framework {

    static readonly defaults: FrameworkOptions = {
        name: 'Jest',
        type: 'jest',
        command: 'yarn test',
        path: '',
        proprietary: {}
    }

    /**
     * Test the given files for framework existence and return appropriate
     * instantiation options, if applicable.
     *
     * @param repository The parsed repository to test.
     */
    public static spawnForDirectory (repository: ParsedRepository): FrameworkOptions | false {
        // Use repository's package.json to determine whether Jest exists or not.
        if (repository.files.includes('package.json')) {
            const pkg = Fs.readJsonSync(Path.join(repository.path, 'package.json'), { throws: false }) || {}
            try {
                // First, test for possible scripts, and adjust default command accordingly
                const scripts = get(pkg, 'scripts')
                for (let script in scripts) {
                    // Test for whole-word "jest". Should match "jest" shorthand
                    // and also "./node_modules/jest/bin/jest.js", etc.
                    if (scripts[script].search(/\bjest\b/) > -1) {
                        return this.hydrate({
                            command: `yarn ${script}`
                        })
                    }
                }
            } catch (Error) {
                // Fail silently, just don't detect Jest.
            }

            // If no scripts with jest are found, check for Jest configuration
            // in the root of the package.json as a last recourse. User will
            // likely need to configure the command manually.
            if (get(pkg, 'jest')) {
                return this.hydrate()
            }
        }
        return false
    }

    /**
     * Prepare this framework for running.
     */
    protected assemble (): void {
        super.assemble()
        if (this.runsInRemote) {
            const reporter = process.env.NODE_ENV === 'development'
                ? Path.resolve(__dirname, '../../reporters/jest')
                : unpacked(Path.join(__static, './reporters/jest'))
            Fs.copySync(reporter, this.injectPath())
        }
    }

    /**
     * Reload this framework's suites and tests.
     */
    protected reload (): Promise<string> {
        return new Promise((resolve, reject) => {
            this.spawn(['--listTests', '--forceExit'])
                .on('success', ({ process }) => {
                    try {
                        const lines = process.getLines()
                        lines.sort()
                        lines.filter((file: string) => this.fileInPath(file))
                            .map((file: string) => this.makeSuite(this.hydrateSuiteResult({
                                file,
                                testsLoaded: false
                            })))
                        resolve('success')
                    } catch (error) {
                        this.stop()
                        reject('The Jest package returned unexpected results.')
                    }
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
     * The command arguments for running this framework.
     */
    protected runArgs (): Array<string> {
        const args = [
            '--verbose=false', // This is required for console to "buffer"
            '--forceExit',
            '--expand',
            '--colors',
            '--reporters',
            this.runsInRemote
                ? Path.join(this.getRemotePath(), '.lode/jest/index.js')
                : process.env.NODE_ENV === 'development'
                    ? Path.resolve(__dirname, '../../reporters/jest/index.js')
                    : unpacked(Path.join(__static, './reporters/jest/index.js'))
        ]

        if (__DEV__) {
            args.push('--useStderr')
        }

        return args
    }

    /**
     * The command arguments for running this framework selectively.
     */
    protected runSelectiveArgs (): Array<string> {
        const args: Array<string> = []

        this.suites.filter(suite => suite.selected).forEach(suite => {
            args.push(suite.getRelativePath())
        })

        return args.concat(this.runArgs())
    }

    /**
     * Provide setup instructions for using Lode with Jest.
     */
    public static instructions (): string {
        return ''
    }

    /**
     * Troubleshoot a Jest error.
     *
     * @param error The error to be parsed for troubleshooting.
     */
    protected troubleshoot (error: Error | string): string {
        if (error instanceof Error) {
            error = error.toString()
        }

        if (error.includes('Error: Could not resolve a module for a custom reporter.')) {
            return 'If your Jest tests run in a remote machine, make sure to toggle that in your framework settings and set the absolute path to the repository inside the remote machine.'
        }

        return super.troubleshoot(error)
    }
}
