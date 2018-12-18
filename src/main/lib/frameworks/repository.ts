import * as Path from 'path'
import { v4 as uuid } from 'uuid'
import { EventEmitter } from 'events'
import { FrameworkStatus, parseFrameworkStatus } from '@lib/frameworks/status'
import { FrameworkFactory } from '@lib/frameworks/factory'
import { FrameworkOptions, IFramework } from '@lib/frameworks/framework'
import { trimStart } from 'lodash'

export interface IRepository extends EventEmitter {
    readonly id: string
    readonly path: string
    readonly name: string
    frameworks: Array<IFramework>
    status: FrameworkStatus
    selected: boolean

    persist (): object
}

export class Repository extends EventEmitter implements IRepository {
    public readonly id: string
    public readonly path: string
    public readonly name: string
    public frameworks: Array<IFramework> = []
    public status: FrameworkStatus = 'idle'
    public selected: boolean = false

    constructor (path: string, id?: string) {
        super()
        this.id = id || uuid()
        this.path = path
        this.name = this.path.split('/').pop() || 'untitled'
    }

    /**
     * Prepares the repository for persistence.
     */
    public persist (): object {
        return {
            id: this.id,
            path: this.path,
            frameworks: this.frameworks.map(framework => framework.persist())
        }
    }

    /**
     * A function to run when a child framwork changes its status.
     */
    protected statusListener (): void {
        this.updateStatus(parseFrameworkStatus(this.frameworks.map(framework => framework.status)))
    }

    /**
     * Update this repository's status.
     *
     * @param to The status we're updating to.
     */
    protected updateStatus (to: FrameworkStatus): void {
        const from = this.status
        this.status = to
        this.emit('status', to, from)
    }

    /**
     * Add a child framework to this repository.
     *
     * @param options The options of the framework we're adding.
     */
    public addFramework (options: FrameworkOptions): void {

        // Append the framework path with the repository path before making, but
        // not before storing the original framework path as a relative one for persistence.
        options.relativePath = trimStart(options.path, '/')
        options.path = options.path ? Path.join(this.path, options.path) : this.path
        // @TODO: determine runner from command
        // ...

        const framework: IFramework = FrameworkFactory.make(options)
        framework.on('status', this.statusListener.bind(this))
        this.frameworks.push(framework)
    }
}
