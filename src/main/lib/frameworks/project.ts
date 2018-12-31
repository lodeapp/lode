import { v4 as uuid } from 'uuid'
import { EventEmitter } from 'events'
import { FrameworkStatus, parseFrameworkStatus } from '@lib/frameworks/status'
import { RepositoryOptions, IRepository, Repository } from '@lib/frameworks/repository'

/**
 * Options to instantiate a Project with.
 */
export type ProjectOptions = {
    id?: string,
    name: string
    repositories?: Array<RepositoryOptions>
}

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

    constructor (options: ProjectOptions) {
        super()
        this.name = options.name
        this.id = options.id || uuid()

        // If options include repositories already (i.e. persisted state), add them.
        if (options.repositories) {
            options.repositories.forEach((repository: RepositoryOptions) => {
                this.addRepository(repository)
            })
        }
    }

    /**
     * Prepares the repository for persistence.
     */
    public persist (): ProjectOptions {
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
     * @param options The options with which to instantiate the new repository.
     */
    public addRepository (options: RepositoryOptions): IRepository {
        const repository = new Repository(options)
        repository.on('status', this.statusListener.bind(this))
        this.repositories.push(repository)
        return repository
    }
}
