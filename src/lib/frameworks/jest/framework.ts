import * as path from 'path'
import { FrameworkOptions, Framework } from '@lib/frameworks/framework'
import { ISuite } from '@lib/frameworks/suite'

export class Jest extends Framework {
    readonly name = 'Jest'

    constructor (options: FrameworkOptions) {
        super(options)
    }

    refresh (): Promise<Array<ISuite>> {
        return new Promise((resolve, reject) => {
            this.spawn(['--listTests'])
                .on('success', ({ process }) => {
                    process.getLines().map((line: string) => this.makeSuite(line))
                    resolve(this.suites)
                })
                .on('error', ({ message }) => {
                    reject(message)
                })
        })
    }

    runArgs (): Array<string> {
        return ['--reporters', path.resolve(__dirname, '../../bridge/jest/reporter.js')]
    }

    runSelectiveArgs (): Array<string> {
        return ['/Users/tomasbuteler/Sites/Amiqus/aqid/tests/assets/js/plugins/filters.spec.js'].concat(this.runArgs())
    }
}
