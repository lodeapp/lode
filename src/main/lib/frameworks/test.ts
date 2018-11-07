import { v4 as uuid } from 'uuid'
import { Status } from '@lib/frameworks/status'
import { Container } from '@lib/frameworks/container'

export interface ITest extends Container {
    readonly id: string
    readonly name: string
    status: Status
    result?: ITestResult
    selected: boolean

    getDisplayName (): string
    toggleSelected (toggle?: boolean, cascade?: boolean): void
    debrief (result: ITestResult, selective: boolean): Promise<void>
    reset (selective: boolean): void
    queue (selective: boolean): void
}

export interface ITestResult {
    name: string
    displayName: string
    status: Status
    content: Array<string>
    feedback: string
    assertions: number
    console: Array<string>
    isLast?: boolean
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
        this.build(result, false)
    }

    getDisplayName (): string {
        return this.displayName
    }

    newTest (result: ITestResult): ITest {
        return new Test(result)
    }

    build (result: ITestResult, cleanup: boolean): void {
        this.updateStatus(result.status || 'idle')
        this.result = result
        if (result.tests && result.tests.length) {
            this.debriefTests(result.tests, cleanup)
        }
    }

    debrief (result: ITestResult, cleanup: boolean): Promise<void> {
        return new Promise((resolve, reject) => {
            this.build(result, cleanup)
            this.emit('debriefed')
            resolve()
        })
    }
}
