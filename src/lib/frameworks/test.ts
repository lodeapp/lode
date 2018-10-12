import { v4 as uuid } from 'uuid'
import { EventEmitter } from 'events'
import { Status } from '@lib/frameworks/status'

export interface ITest extends EventEmitter {
    readonly id: string
    readonly name: string
    status: Status
    selected: boolean

    toggleSelected (toggle?: boolean, cascade?: boolean): void
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

export class Test extends EventEmitter implements ITest {
    public readonly id: string
    public readonly name: string
    public readonly displayName: string
    public status!: Status
    public result?: ITestResult
    public selected: boolean = false

    constructor (result: ITestResult) {
        super()
        this.id = uuid()
        this.name = result.name
        this.displayName = result.displayName || result.name
        this.build(result)
    }

    build (result: ITestResult): void {
        this.status = result.status || 'idle'
        this.result = result
    }

    toggleSelected (toggle?: boolean, cascade?: boolean): void {
        this.selected = typeof toggle === 'undefined' ? !this.selected : toggle
        this.emit('selective')
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
