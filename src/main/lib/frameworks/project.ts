import { v4 as uuid } from 'uuid'
import { EventEmitter } from 'events'
import { FrameworkStatus, parseFrameworkStatus } from '@lib/frameworks/status'
import { IRepository, Repository } from '@lib/frameworks/repository'

export interface IProject extends EventEmitter {
    readonly id: string
    readonly name: string
    repositories: Array<IRepository>
    status: FrameworkStatus
    selected: boolean
}

export class Project extends EventEmitter implements IProject {
    public readonly id: string
    public readonly name: string
    public repositories: Array<IRepository> = []
    public status: FrameworkStatus = 'idle'
    public selected: boolean = false

    constructor (name: string, id?: string) {
        super()
        this.name = name
        this.id = id || uuid()
    }

    /**
     * Prepares the repository for persistence.
     */
    public persist (): object {
        return {
            id: this.id,
            name: this.name,
            repositories: this.repositories.map(repository => repository.persist())
        }
    }

    /**
     * A function to run when a child repository changes its status.
     */
    protected statusListener () {
        this.updateStatus(parseFrameworkStatus(this.repositories.map(repository => repository.status)))
    }

    /**
     * Update this project's status.
     *
     * @param to The status we're updating to.
     */
    protected updateStatus (to: FrameworkStatus): void {
        const from = this.status
        this.status = to
        this.emit('status', to, from)
    }

    /**
     * Add a child repository to this project.
     *
     * @param path The path of the repository we're adding.
     * @param id The existing id of the repository we're adding.
     */
    public addRepository (path: string, id?: string): IRepository {
        const repository = new Repository(path, id)
        repository.on('status', this.statusListener.bind(this))
        this.repositories.push(repository)
        return repository
    }
}
