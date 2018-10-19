import { v4 as uuid } from 'uuid'
import { EventEmitter } from 'events'
import { Status } from '@lib/frameworks/status'
import { Container } from '@lib/frameworks/container'

export interface ITest extends EventEmitter {
    readonly id: string
    readonly name: string
    status: Status
    selected: boolean

    toggleSelected (toggle?: boolean, cascade?: boolean): void
    update (result: ITestResult): void
    debrief (result: ITestResult): Promise<void>
    reset (): void
}

export interface ITestResult {
    name: string
    displayName: string
    status: Status
    content: Array<string>
    feedback: string
    assertions: number
    console: Array<string>
    tests?: Array<ITestResult>
}

export class Test extends Container implements ITest {
    public readonly id: string
    public readonly name: string
    public readonly displayName: string
    public status!: Status
    public result?: ITestResult

    constructor (result: ITestResult) {
        super()
        this.id = uuid()
        this.name = result.name
        this.displayName = result.displayName || result.name
        this.build(result)
    }

    newTest (result: ITestResult): ITest {
        return new Test(result)
    }

    build (result: ITestResult): void {
        this.update(result)
        if (result.tests && result.tests.length) {
            this.tests = result.tests.map((nested: ITestResult) => {
                const test = this.makeTest(nested)
                test.update(nested)
                return test
            })
        }
    }

    update (result: ITestResult): void {
        this.status = result.status || 'idle'
        this.result = result
    }

    debrief (result: ITestResult): Promise<void> {
        return new Promise((resolve, reject) => {
            this.build(result)
            resolve()
        })
    }

    reset (): void {
        this.status = 'idle'
        super.reset()
    }
}
