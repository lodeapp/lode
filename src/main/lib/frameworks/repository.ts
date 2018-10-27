import { v4 as uuid } from 'uuid'
import { FrameworkStatus } from '@lib/frameworks/status'
import { IFramework } from '@lib/frameworks/framework'

export interface IRepository {
    readonly id: string
    readonly path: string
    frameworks: Array<IFramework>
    status: FrameworkStatus
    selected: boolean
}

export class Repository implements IRepository {
    public readonly id: string
    public readonly path: string
    public frameworks: Array<IFramework> = []
    public status: FrameworkStatus = 'idle'
    public selected: boolean = false

    constructor (path: string) {
        this.id = uuid()
        this.path = path
    }

    addFramework (framework: IFramework): void {
        this.frameworks.push(framework)
    }
}
