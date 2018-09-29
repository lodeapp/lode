import { FrameworkOptions, Framework } from '@lib/frameworks/framework'
import { ISuite, ISuiteResult } from '@lib/frameworks/suite'
import { PHPUnitSuite } from '@lib/frameworks/phpunit/suite'

export class PHPUnit extends Framework {
    readonly name = 'PHPUnit'

    constructor (options: FrameworkOptions) {
        super(options)
    }

    refresh (): Promise<Array<ISuite>> {
        return new Promise((resolve, reject) => {
            this.spawn(['--columns=42'].concat(this.runArgs()))
                .on('report', ({ report }) => {
                    report.forEach((result: ISuiteResult) => {
                        this.makeSuite(result)
                    })
                    resolve([])
                })
                .on('error', ({ message }) => {
                    reject(message)
                })
        })
    }

    runArgs (): Array<string> {
        return ['--printer', '\\LodeApp\\PHPUnit\\Reporter']
    }

    runSelectiveArgs (): Array<string> {
        console.log(this.suites.filter(suite => suite.selected))

        return ['tests/Unit/HelpersTest.php'].concat(this.runArgs())
    }

    newSuite (result: ISuiteResult): ISuite {
        return new PHPUnitSuite({
            path: this.path,
            vmPath: this.vmPath
        }, result)
    }
}
