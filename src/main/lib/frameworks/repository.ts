import { v4 as uuid } from 'uuid'
import { EventEmitter } from 'events'
import { FrameworkStatus, parseFrameworkStatus } from '@lib/frameworks/status'
import { IFramework } from '@lib/frameworks/framework'

export interface IRepository extends EventEmitter {
    readonly id: string
    readonly path: string
    readonly name: string
    frameworks: Array<IFramework>
    status: FrameworkStatus
    selected: boolean
}

export class Repository extends EventEmitter implements IRepository {
    public readonly id: string
    public readonly path: string
    public readonly name: string
    public frameworks: Array<IFramework> = []
    public status: FrameworkStatus = 'idle'
    public selected: boolean = false

    constructor (path: string) {
        super()
        this.id = uuid()
        this.path = path
        this.name = this.path.split('/').pop() || 'untitled'
    }

    /**
     * Add a child framework to this repository.
     *
     * @param framework The framework object to add.
     */
    addFramework (framework: IFramework): void {
        framework.on('status', this.statusListener.bind(this))
        this.frameworks.push(framework)
    }

    /**
     * A function to run when a child framwork changes its status.
     */
    statusListener (): void {
        this.updateStatus(parseFrameworkStatus(this.frameworks.map(framework => framework.status)))
    }

    /**
     * Update this repository's status.
     *
     * @param to The status we're updating to.
     */
    updateStatus (to: FrameworkStatus): void {
        const from = this.status
        this.status = to
        this.emit('status', to, from)
    }
}
