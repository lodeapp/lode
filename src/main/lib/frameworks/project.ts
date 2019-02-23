import { v4 as uuid } from 'uuid'
import { findIndex } from 'lodash'
import { EventEmitter } from 'events'
import { state } from '@main/lib/state'
import { Project as ProjectState } from '@main/lib/state/project'
import { FrameworkStatus, parseFrameworkStatus } from '@main/lib/frameworks/status'
import { RepositoryOptions, IRepository, Repository } from '@main/lib/frameworks/repository'

/**
 * The minimal options to identify a project by.
 */
export type ProjectIdentifier = {
    id: string
    name: string
}

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
    initialRepositoryCount: number
    initialRepositoryReady: number
    status: FrameworkStatus
    selected: boolean

    start (): void
    refresh (): void
    stop (): Promise<void>
    isRunning (): boolean
    isRrefreshing (): boolean
    isBusy (): boolean
    persist (): ProjectOptions
    save (): void
    updateOptions (options: ProjectOptions): void
    addRepository (options: RepositoryOptions): Promise<IRepository>
    removeRepository (id: string): void
}

export class Project extends EventEmitter implements IProject {
    public readonly id: string
    public name: string
    public repositories: Array<IRepository> = []
    public initialRepositoryCount: number = 0
    public initialRepositoryReady: number = 0
    public status: FrameworkStatus = 'loading'
    public selected: boolean = false

    protected state: ProjectState
    protected parsed: boolean = false
    protected ready: boolean = false

    constructor (options: ProjectOptions) {
        super()
        this.name = options.name
        this.id = options.id || uuid()
        this.state = state.project(this.id)
        this.initialRepositoryCount = (options.repositories || []).length

        // If options include repositories already (i.e. persisted state), add them.
        this.loadRepositories(options.repositories || [])

        // If this project doesn't yet exist, create it.
        if (!options.id) {
            this.save()
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
     * Refresh all of this project's repositories.
     */
    public refresh (): void {
        this.repositories.forEach((repository: IRepository) => {
            repository.refresh()
        })
    }

    /**
     * Stop any repository in this project that might be running.
     */
    public async stop (): Promise<void> {
        return new Promise((resolve, reject) => {
            Promise.all(this.repositories.map((repository: IRepository) => {
                return repository.stop()
            })).then(() => {
                resolve()
            })
        })
    }

    /**
     * Whether this project is running.
     */
    public isRunning (): boolean {
        return this.repositories.some((repository: IRepository) => repository.isRunning())
    }

    /**
     * Whether this project is refreshing.
     */
    public isRrefreshing (): boolean {
        return this.repositories.some((repository: IRepository) => repository.isRrefreshing())
    }

    /**
     * Whether this project is busy.
     */
    public isBusy (): boolean {
        return this.repositories.some((repository: IRepository) => repository.isBusy())
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
     * Save this project in the persistent store.
     */
    public save (): void {
        this.state.update(this.persist())
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
     * A function to run when a child repository changes its state (i.e. runs, stops, etc).
     */
    protected stateListener (): void {
        this.state.set('busy', this.isBusy())
    }

    /**
     * A function to run when a child repository requests saving.
     */
    protected saveListener (): void {
        this.save()
    }

    /**
     * Prepare the project for parsed state.
     */
    protected onParsed (): void {
        this.parsed = true
        if (!this.initialRepositoryCount) {
            this.onReady()
        }
        this.emit('parsed', this)
    }

    /**
     * Prepare the project for ready state.
     */
    protected onReady (): void {
        this.ready = true
        if (!this.initialRepositoryCount) {
            this.updateStatus('idle')
        }
        this.emit('ready', this)
    }

    /**
     * Listener for when a child framework is ready.
     */
    protected onRepositoryReady (): void {
        this.initialRepositoryReady++
        if (this.initialRepositoryReady >= this.initialRepositoryCount) {
            this.onReady()
        }
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
     * Load a group of repositories to this project on first instantiation.
     *
     * @param repositories The repositories to add to this project.
     */
    protected async loadRepositories (repositories: Array<RepositoryOptions>): Promise<void> {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                Promise.all(repositories.map((repository: RepositoryOptions) => {
                    return this.addRepository(repository)
                })).then(() => {
                    this.onParsed()
                    resolve()
                })
            })
        })
    }

    /**
     * Add a child repository to this project.
     *
     * @param options The options with which to instantiate the new repository.
     */
    public async addRepository (options: RepositoryOptions): Promise<IRepository> {
        return new Promise((resolve, reject) => {
            const repository = new Repository(options)
            repository
                .on('ready', this.onRepositoryReady.bind(this))
                .on('status', this.statusListener.bind(this))
                .on('state', this.stateListener.bind(this))
                .on('save', this.saveListener.bind(this))
            this.repositories.push(repository)
            resolve(repository)
        })
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
