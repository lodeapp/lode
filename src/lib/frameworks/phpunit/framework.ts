import { FrameworkOptions, Framework } from '@lib/frameworks/framework'
import { ISuite } from '@lib/frameworks/suite'
import { ITest } from '@lib/frameworks/test'

export class PHPUnit extends Framework {
    readonly name = 'PHPUnit'

    constructor (options: FrameworkOptions) {
        super(options)
    }

    refresh (): Promise<Array<ISuite>> {
        return new Promise((resolve, reject) => {
            resolve([])
        })
    }

    runArgs (): Array<string> {
        return ['--printer', '\\TestRunner\\PHPUnit\\Reporter']
    }

    runSelectiveArgs (suites: Array<ISuite>, tests: Array<ITest>): Array<string> {
        return ['tests/Unit/HelpersTest.php'].concat(this.runArgs())
    }
}
