import * as Path from 'path'
import * as Fs from 'fs-extra'
import { get } from 'lodash'
import { unpacked, loc, posix } from '@lib/helpers/paths'
import { ParsedRepository } from '@lib/frameworks/repository'
import { FrameworkOptions, Framework } from '@lib/frameworks/framework'
import { ISuite } from '@lib/frameworks/suite'
import { FrameworkSort } from '@lib/frameworks/sort'

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
                ? Path.resolve(__dirname, loc('../../reporters/jest'))
                : unpacked(Path.join(__static, loc('./reporters/jest')))
            Fs.copySync(reporter, this.injectPath())
        }
    }

    /**
     * Reload this framework's suites and tests.
     */
    protected reload (): Promise<string> {
        return new Promise((resolve, reject) => {
            this.spawn(['--listTests', '--forceExit'])
                .on('success', ({ lines }) => {
                    try {
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
                ? Path.join(this.getRemotePath(), loc('.lode/jest/index.js'))
                : process.env.NODE_ENV === 'development'
                    ? Path.resolve(__dirname, loc('../../reporters/jest/index.js'))
                    : unpacked(Path.join(__static, loc('./reporters/jest/index.js')))
        ]

        if (__DEV__) {
            args.push('--useStderr')
        }

        return args
    }

    /**
     * The command arguments for running this framework selectively.
     *
     * @param suites The suites selected to run.
     * @param selectTests Whether to check for selected tests, or run the entire suite.
     */
    protected runSelectiveArgs (suites: Array<ISuite>, selectTests: boolean): Array<string> {
        const args: Array<string> = []

        suites.forEach((suite: ISuite) => {
            // Push relative paths in POSIX notation, as Jest doesn't seem
            // to find tests searched with Windows-style path separators.
            args.push(posix(suite.getRelativePath()))
        })

        return args.concat(this.runArgs())
    }

    /**
     * Get all sort options supported by this framework.
     */
    public getSupportedSorts (): Array<FrameworkSort> {
        const supported = super.getSupportedSorts()
        return supported.filter((sort: FrameworkSort) => {
            return sort !== 'framework'
        })
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
