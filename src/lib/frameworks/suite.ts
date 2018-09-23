import * as path from 'path'
import { find } from 'lodash'
import { Test, ITest, ITestResult } from '@lib/frameworks/test'
import { Status, parseStatus } from '@lib/frameworks/status'

export type SuiteOptions = {
    path: string,
    vmPath?: string | null
}

export interface ISuite {
    readonly file: string
    readonly relative: string
    readonly root: string
    status: Status
    tests: Array<ITest>

    debrief (result: ISuiteResult): Promise<void>
    reset (): void
}

export interface ISuiteResult {
    file: string
    tests: Array<ITestResult>
}

export class Suite implements ISuite {
    public readonly file: string
    public readonly relative: string
    public readonly root: string
    public readonly vmPath: string | null
    public tests: Array<ITest>
    public running: Array<Promise<void>>
    public status: Status

    constructor (file: string, options: SuiteOptions) {
        this.file = file
        this.root = options.path
        this.vmPath = options.vmPath || null
        this.relative = path.relative(this.vmPath || this.root, this.file)
        this.tests = []
        this.running = []
        this.status = 'idle'
    }

    debrief (suiteResult: ISuiteResult): Promise<void> {
        return new Promise((resolve, reject) => {
            suiteResult.tests.forEach((result: ITestResult) => {
                let test: ITest = this.makeTest(result)
                this.running.push(test.debrief(result))
            })

            Promise.all(this.running).then(() => {
                this.afterDebrief(true)
                resolve()
            })
        })
    }

    reset (): void {
        this.status = 'idle'
        this.tests.forEach(test => {
            test.reset()
        })
    }

    afterDebrief (cleanup: boolean = false): void {
        console.log('cleaning up suite')
        if (cleanup) {
            this.tests = this.tests.filter(test => test.status !== 'idle')
        }
        this.status = parseStatus(this.tests.map(test => test.status))
    }

    newTest (result: ITestResult): ITest {
        return new Test(result)
    }

    findTest (name: string): ITest | undefined {
        return find(this.tests, { name })
    }

    makeTest (result: ITestResult): ITest {
        let test: ITest | undefined = this.findTest(result.name)
        if (!test) {
            test = this.newTest(result)
            this.tests.push(test)
        }
        return test
    }
}
