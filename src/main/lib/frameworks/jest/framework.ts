import * as Path from 'path'
import * as Fs from 'fs-extra'
import { get } from 'lodash'
import { ParsedRepository } from '@lib/frameworks/repository'
import { FrameworkOptions, Framework } from '@lib/frameworks/framework'
import { Suite } from '@lib/frameworks/suite'

export class Jest extends Framework {

    static readonly defaults: FrameworkOptions = {
        name: 'Jest',
        type: 'jest',
        command: 'yarn test',
        path: ''
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
        const args = [
            '--forceExit',
            '--expand',
            '--colors',
            '--reporters',
            '@lodeapp/jest'
        ]

        if (__DEV__) {
            args.push('--verbose')
        }

        return args
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
            return 'Make sure to include the Lode Jest reporter package as a dependency in your repository. You can do this by running `yarn add --dev @lodeapp/jest` or `npm install --save-dev @lodeapp/jest` inside your repository\'s directory.'
        }

        return ''
    }
}
