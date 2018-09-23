import { Status } from '@lib/frameworks/status'

export interface ITest {
    readonly name: string
    status: Status

    debrief(result: ITestResult): Promise<void>
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
}

export class Test implements ITest {
    public readonly name: string
    public readonly displayName: string
    public status!: Status
    public result?: ITestResult

    constructor (result: ITestResult) {
        this.name = result.name
        this.displayName = result.displayName || result.name
        this.build(result)
    }

    build (result: ITestResult): void {
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
    }
}
