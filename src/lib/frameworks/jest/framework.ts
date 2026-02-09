import type { FrameworkDefaults, FrameworkOptions, FrameworkReloadOutcome } from '@lib/frameworks/framework'
import type { ParsedRepository } from '@lib/frameworks/repository'
import type { ISuite } from '@lib/frameworks/suite'
import * as Path from 'node:path'
import { Framework } from '@lib/frameworks/framework'
import { buildExecCommand, buildScriptCommand, detectPackageManager } from '@lib/helpers/package-manager'
import { loc, posix, unpacked } from '@lib/helpers/paths'
import * as Fs from 'fs-extra'
import { get } from 'lodash'

const jestConfigFiles = [
    'jest.config.js',
    'jest.config.ts',
    'jest.config.cjs',
    'jest.config.mjs',
    'jest.config.json',
]

export class Jest extends Framework {
    static readonly defaults: FrameworkDefaults = {
        all: {
            name: 'Jest',
            type: 'jest',
            command: './node_modules/.bin/jest',
            path: '',
            proprietary: {},
        },
        win32: {
            command: 'node_modules\\.bin\\jest.cmd',
        },
    }

    /**
     * Test the given files for framework existence and return appropriate
     * instantiation options, if applicable.
     *
     * @param repository The parsed repository to test.
     */
    public static async spawnForDirectory(repository: ParsedRepository): Promise<FrameworkOptions | false> {
        const manager = detectPackageManager(repository.files)

        // Use repository's package.json to determine whether Jest exists or not.
        if (repository.files.includes('package.json')) {
            const pkg = await Fs.readJson(Path.join(repository.path, 'package.json'), { throws: false }) || {}
            try {
                // First, test for possible scripts, and adjust default command accordingly
                const scripts = get(pkg, 'scripts')
                for (const script in scripts) {
                    // Test for whole-word "jest". Should match "jest" shorthand
                    // and also "./node_modules/jest/bin/jest.js", etc.
                    if (scripts[script].search(/(?<![^/\\\s])jest\b(\.js)?(?!\.)/i) > -1) {
                        return this.hydrate({
                            command: buildScriptCommand(manager, script),
                        })
                    }
                }
            }
            catch (Error) {
                // Fail silently, just don't detect Jest.
            }

            // If no scripts with jest are found, check for Jest configuration
            // in the root of the package.json.
            if (get(pkg, 'jest')) {
                return this.hydrate({
                    command: buildExecCommand(manager, 'jest'),
                })
            }
        }

        // Check for standalone Jest configuration files.
        if (jestConfigFiles.some(file => repository.files.includes(file))) {
            return this.hydrate({
                command: buildExecCommand(manager, 'jest'),
            })
        }

        return false
    }

    /**
     * Prepare this framework for running.
     */
    protected async assemble(): Promise<void> {
        super.assemble()
        if (this.runsInRemote) {
            const reporter = process.env.NODE_ENV === 'development'
                ? Path.join(__static, loc('./reporters/jest'))
                : unpacked(Path.join(__static, loc('./reporters/jest')))
            await Fs.copy(reporter, this.injectPath())
        }
    }

    /**
     * Reload this framework's suites and tests.
     */
    protected reload(): Promise<FrameworkReloadOutcome> {
        return new Promise((resolve, reject) => {
            this.spawn(['--listTests', '--forceExit'])
                .on('success', ({ lines }) => {
                    try {
                        lines.sort()
                        lines.filter((file: string) => this.fileInPath(file))
                            .map((file: string) => this.makeSuite(this.hydrateSuiteResult({
                                file,
                                testsLoaded: false,
                            })))
                        resolve('success')
                    }
                    catch (error) {
                        this.stop()
                        reject(new Error('The Jest package returned unexpected results.'))
                    }
                })
                .on('killed', () => {
                    resolve('killed')
                })
                .on('error', (error) => {
                    reject(error)
                })
        })
    }

    /**
     * The command arguments for running this framework.
     */
    protected runArgs(): Array<string> {
        const args = [
            '--verbose=false', // This is required for console to "buffer"
            '--forceExit',
            '--expand',
            '--colors',
            '--reporters',
            this.runsInRemote
                ? Path.join(this.getRemotePath(), loc('.lode/jest/index.js'))
                : process.env.NODE_ENV === 'development'
                    ? Path.join(__static, loc('./reporters/jest/index.js'))
                    : unpacked(Path.join(__static, loc('./reporters/jest/index.js'))),
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
    protected runSelectiveArgs(suites: Array<ISuite>, selectTests: boolean): Array<string> {
        const args: Array<string> = []

        suites.forEach((suite: ISuite) => {
            // Push relative paths in POSIX notation, as Jest doesn't seem
            // to find tests searched with Windows-style path separators.
            args.push(posix(suite.getRelativePath()))
        })

        return args.concat(this.runArgs())
    }

    /**
     * Provide setup instructions for using Lode with Jest.
     */
    public static instructions(): string {
        return ''
    }

    /**
     * Troubleshoot a Jest error.
     *
     * @param error The error to be parsed for troubleshooting.
     */
    protected troubleshoot(error: Error | string): string {
        if (error instanceof Error) {
            error = error.toString()
        }

        if (error.includes('Error: Could not resolve a module for a custom reporter.')) {
            return 'If your Jest tests run in a remote machine, make sure to toggle that in your framework settings and set the absolute path to the repository inside the remote machine.'
        }

        return super.troubleshoot(error)
    }
}
