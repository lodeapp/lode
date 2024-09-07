import * as Path from 'path'
import * as Fs from 'fs-extra'
import semver from 'semver'
import { unpacked, loc } from '@lib/helpers/paths'
import { ParsedRepository } from '@lib/frameworks/repository'
import { FrameworkOptions, FrameworkDefaults, Framework, FrameworkReloadOutcome } from '@lib/frameworks/framework'
import { ISuiteResult, ISuite, Suite } from '@lib/frameworks/suite'
import { ITest } from '@lib/frameworks/test'
import { PHPUnit10Suite } from '@lib/frameworks/phpunit-10/suite'
import { FrameworkValidator } from '@lib/frameworks/validator'
import { FrameworkSort } from '@lib/frameworks/sort'
import { castArray } from 'lodash'

export class PHPUnit10 extends Framework {
    public readonly canToggleTests: boolean = true

    static readonly defaults: FrameworkDefaults = {
        all: {
            name: 'PHPUnit',
            type: 'phpunit-10',
            command: './vendor/bin/phpunit',
            path: '',
            proprietary: {
                autoloadPath: ''
            }
        },
        win32: {
            command: 'php vendor/phpunit/phpunit/phpunit'
        }
    }

    // Set PHPUnit's default sort order
    static readonly sortDefault: FrameworkSort = 'framework'

    // Suites are defined in the parent constructor (albeit a different class),
    // so we'll just inherit the default value from it (or risk overriding it).
    public suites!: Array<PHPUnit10Suite>

    /**
     * The class of suite we use for this framework. Overrides the default
     * with a PHPUnit-specific suite class.
     */
    protected suiteClass (): typeof Suite {
        return PHPUnit10Suite
    }

    /**
     * Test the given files for framework existence and return appropriate
     * instantiation options, if applicable.
     *
     * @param repository The parsed repository to test.
     */
    public static async spawnForDirectory (repository: ParsedRepository): Promise<FrameworkOptions | false> {
        return new Promise((resolve, reject) => {
            Fs.readFile(Path.join(repository.path, 'vendor/phpunit/phpunit/composer.json'), {}, (error: Error, data: Buffer) => {
                if (error) {
                    resolve(false)
                }

                try {
                    const composer = JSON.parse(data.toString('utf8'))

                    if (
                        semver.gte(
                            semver.coerce(composer.extra['branch-alias']['dev-main']) || semver.coerce(composer.extra['branch-alias']['dev-master']) || '0.0.0',
                            '10.0.0'
                        )
                    ) {
                        resolve(this.hydrate())
                    }
                } catch (_) {
                }

                resolve(false)
            })
        })
    }

    /**
     * Prepare this framework for running.
     */
    protected async assemble (): Promise<void> {
        super.assemble()
        if (this.runsInRemote) {
            const reporter = process.env.NODE_ENV === 'development'
                ? Path.resolve(__dirname, loc(`../../reporters/${this.type}`))
                : unpacked(Path.join(__static, loc(`./reporters/${this.type}`)))

            await Fs.copy(reporter, this.injectPath())
        }
    }

    /**
     * Reload this framework's suites and tests.
     */
    protected reload (): Promise<FrameworkReloadOutcome> {
        return new Promise((resolve, reject) => {
            this.spawn(['--columns=42'].concat(this.runArgs()))
                .on('report', ({ report }) => {
                    try {
                        Promise.all(castArray(report).map((result: ISuiteResult) => {
                            return this.makeSuite(this.hydrateSuiteResult(result), true)
                        })).then(() => {
                            resolve('success')
                        })
                    } catch (error) {
                        console.log({ error })
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
        const autoload = Path.join(root, loc(this.proprietary.autoloadPath || 'vendor/autoload.php'))
        const args = [
            '-d',
            `lode_bootstrap=${autoload}`,
            '--bootstrap',
            this.runsInRemote
                ? Path.join(this.getRemotePath(), loc(`.lode/${this.type}/bootstrap.php`))
                : process.env.NODE_ENV === 'development'
                    ? Path.resolve(__dirname, loc(`../../reporters/${this.type}/bootstrap.php`))
                    : unpacked(Path.join(__static, loc(`./reporters/${this.type}/bootstrap.php`))),
            // Sometimes writing to stdout will fail (on remote machines?). If we
            // can ever figure out why, we should revert back to default.
            '--stderr',
            '--color=always'
            // @TODO: restore
            // '--no-output'
        ]

        if (__DEV__) {
            args.push(
                '--display-errors'
            )
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
        const args: Array<string> = ['--filter']
        const filters: Array<string> = []
        suites.forEach((suite: ISuite) => {
            const suiteClass = (suite as PHPUnit10Suite).getClassName()
            const selected = suite.tests.filter((test: ITest) => selectTests ? test.selected : true)
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
     * Calculate the total amount we need to measure for progress for the given
     * suites. PHPUnit suites are reported test by test, so we'll need to set
     * the total for the amount of tests within the framework, as opposed to
     * the amount of suites which we'd ordinarily measure.
     *
     * @param suites The suites whose progress we're setting up to measure.
     */
    protected calculateProgressTotalForSuites (suites: Array<ISuite>): number {
        return suites.reduce((acc, suite: ISuite) => {
            // Return the children count, or 1 if suite is empty, as it will
            // and progress counted regardless of it having children or not.
            return acc + (suite.countChildren() || 1)
        }, 0)
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
     * Provide setup instructions for using Lode with PHPUnit.
     */
    public static instructions (): string {
        return ''
    }

    /**
     * Process a PHPUnit test feedback message.
     *
     * @param text The feedback text to be processed by the framework.
     */
    public processFeedbackText (text: string): string {
        // @TODO: Offload to separate class that parses and replaces strings.
        if (text && text.match(/^Failed asserting that '(.+)' matches JSON string "(.|\s)+"./gim)) {
            // ...
        }

        return text
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
