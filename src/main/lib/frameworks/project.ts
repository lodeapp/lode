import { v4 as uuid } from 'uuid'
import { findIndex } from 'lodash'
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
    name: string
    repositories: Array<IRepository>
    status: FrameworkStatus
    selected: boolean

    start (): void
    stop (): Promise<void>
    persist (): ProjectOptions
}

export class Project extends EventEmitter implements IProject {
    public readonly id: string
    public name: string
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
     * Run all of this project's repositories.
     */
    public start (): void {
        this.repositories.forEach((repository: IRepository) => {
            repository.start()
        })
    }

    /**
     * Stop any repository in this project that might be running.
     */
    public stop (): Promise<void> {
        return new Promise((resolve, reject) => {
            const stopping = this.repositories.map((repository: IRepository) => {
                return repository.stop()
            })
            Promise.all(stopping).then(() => {
                resolve()
            })
        })
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
     * Update this project's options.
     *
     * @param options The new set of options.
     */
    public updateOptions (options: ProjectOptions): void {
        // Currently only the name is editable
        this.name = options.name
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

    /**
     * Remove a child repository from this project using its unique id.
     *
     * @param id The id of the repository to remove.
     */
    public removeRepository (id: string): void {
        const index = findIndex(this.repositories, { id })
        if (index > -1) {
            this.repositories.splice(index, 1)
        }
    }
}
