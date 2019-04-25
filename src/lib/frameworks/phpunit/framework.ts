import * as Path from 'path'
import * as Fs from 'fs-extra'
import { unpacked } from '@lib/helpers'
import { ParsedRepository } from '@lib/frameworks/repository'
import { FrameworkOptions, Framework } from '@lib/frameworks/framework'
import { ISuiteResult, Suite } from '@lib/frameworks/suite'
import { ITest } from '@lib/frameworks/test'
import { PHPUnitSuite } from '@lib/frameworks/phpunit/suite'
import { FrameworkValidator } from '@lib/frameworks/validator'

export class PHPUnit extends Framework {

    static readonly defaults: FrameworkOptions = {
        name: 'PHPUnit',
        type: 'phpunit',
        command: './vendor/bin/phpunit',
        path: '',
        proprietary: {
            autoloadPath: ''
        }
    }

    // Suites are defined in the parent constructor (albeit a different class),
    // so we'll just inherit the default value from it (or risk overriding it).
    public suites!: Array<PHPUnitSuite>

    /**
     * The class of suite we use for this framework. Overrides the default
     * with a PHPUnit-specific suite class.
     */
    protected suiteClass(): typeof Suite {
        return PHPUnitSuite
    }

    /**
     * Test the given files for framework existence and return appropriate
     * instantiation options, if applicable.
     *
     * @param repository The parsed repository to test.
     */
    public static spawnForDirectory (repository: ParsedRepository): FrameworkOptions | false {
        // Cheapest way to check is the PHPUnit XML config file.
        if (repository.files.includes('phpunit.xml') || repository.files.includes('phpunit.xml.dist')) {
            return this.hydrate()
        }
        // If no config file exists, check for binary inside dependencies.
        if (Fs.existsSync(Path.join(repository.path, 'vendor/bin/phpunit'))) {
            return this.hydrate()
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
                ? Path.resolve(__dirname, '../../reporters/phpunit')
                : unpacked(Path.join(__static, './reporters/phpunit'))
            Fs.copySync(reporter, this.injectPath())
        }
    }

    /**
     * Reload this framework's suites and tests.
     */
    protected reload (): Promise<string> {
        return new Promise((resolve, reject) => {
            this.spawn(['--columns=42'].concat(this.runArgs()))
                .on('report', ({ report }) => {
                    try {
                        Promise.all(report.map((result: ISuiteResult) => {
                            return this.makeSuite(this.hydrateSuiteResult(result), true)
                        })).then(() => {
                            resolve('success')
                        })
                    } catch (error) {
                        this.stop()
                        reject('The PHPUnit package returned unexpected results.')
                    }
                })
                .on('success', () => {
                    // Resolve the promise as empty if `report` event was
                    // never emitted by the process.
                    resolve('empty')
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
        const root = (this.runsInRemote ? this.getRemotePath() : this.repositoryPath)
        const autoload = Path.join(root, this.proprietary.autoloadPath || 'vendor/autoload.php')
        const args = [
            `-d lode_bootstrap=${autoload}`,
            '--bootstrap',
            this.runsInRemote
                ? Path.join(this.getRemotePath(), '.lode/phpunit/bootstrap.php')
                : process.env.NODE_ENV === 'development'
                    ? Path.resolve(__dirname, '../../reporters/phpunit/bootstrap.php')
                    : unpacked(Path.join(__static, './reporters/phpunit/bootstrap.php')),
            // Sometimes writing to stdout will fail (on remote machines?). If we
            // can ever figure out why, we should revert back to default.
            '--stderr',
            '--color=always',
            '--printer',
            '\\LodeApp\\PHPUnit\\LodeReporter'
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
        const args: Array<string> = ['--filter']
        const filters: Array<string> = []

        this.suites.filter(suite => suite.selected).forEach((suite: PHPUnitSuite) => {
            const suiteClass = suite.getClassName()
            const selected = suite.tests.filter((test: ITest) => test.selected)
            if (selected.length !== suite.tests.length) {
                // If not running all tests from suite, filter each one
                selected.forEach((test: ITest) => {
                    filters.push(`${suiteClass}::${test.getName()}$`)
                })
            } else {
                filters.push(suiteClass)
            }
        })

        args.push(`"${filters.join('|')}"`)

        return args.concat(this.runArgs())
    }

    /**
     * Validate PHPUnit specific options.
     */
    public static validate (validator: FrameworkValidator, options: any): void {
        const autoload = options.proprietary.autoloadPath
        if (autoload) {
            if (Path.isAbsolute(autoload) || !validator.isFile(Path.join(validator.repositoryPath, autoload))) {
                validator.addError('autoloadPath', 'Please enter a valid file inside the repository directory.')
            }
        }
    }

    /**
     * Provide setup instructions for using Lode with Jest.
     */
    public static instructions (): string {
        return ''
    }

    /**
     * Troubleshoot a PHPUnit error.
     *
     * @param error The error to be parsed for troubleshooting.
     */
    protected troubleshoot (error: Error | string): string {
        if (error instanceof Error) {
            error = error.toString()
        }

        if ((new RegExp('Cannot open file .*\/bootstrap\.php', 'gi')).test(error)) {
            return 'If your PHPUnit tests run in a remote machine, make sure to toggle that in your framework settings and set the absolute path to the repository inside the remote machine.'
        }

        return super.troubleshoot(error)
    }
}
