import { v4 as uuid } from 'uuid'
import { findIndex } from 'lodash'
import { EventEmitter } from 'events'
import { state } from '@lib/state'
import { Project as ProjectState } from '@lib/state/project'
import { FrameworkStatus, parseFrameworkStatus } from '@lib/frameworks/status'
import { RepositoryOptions, IRepository, Repository } from '@lib/frameworks/repository'

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
    name: string
    repositories: Array<IRepository>
    status: FrameworkStatus
    selected: boolean

    getId (): string
    start (): void
    refresh (): void
    stop (): Promise<void>
    isRunning (): boolean
    isRrefreshing (): boolean
    isBusy (): boolean
    empty (): boolean
    persist (): ProjectOptions
    save (): void
    updateOptions (options: ProjectOptions): void
    addRepository (options: RepositoryOptions): Promise<IRepository>
    removeRepository (id: string): void
}

export class Project extends EventEmitter implements IProject {
    public name: string
    public repositories: Array<IRepository> = []
    public status: FrameworkStatus = 'loading'
    public selected: boolean = false

    protected readonly id: string
    protected state: ProjectState
    protected parsed: boolean = false
    protected ready: boolean = false
    protected hasRepositories: boolean = false
    protected initialRepositoryCount: number = 0
    protected initialRepositoryReady: number = 0

    constructor (identifier: ProjectIdentifier) {
        super()
        this.name = identifier.name
        this.id = identifier.id || uuid()
        this.state = state.project(this.id)

        // Load options from the persistent project state.
        const options = this.state.get('options')
        this.initialRepositoryCount = (options.repositories || []).length
        this.hasRepositories = this.initialRepositoryCount > 0

        // If options include repositories already (i.e. persisted state), add them.
        this.loadRepositories(options.repositories || [])

        // If this project doesn't yet exist, create it.
        if (!identifier.id) {
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
     * Whether this project has any repositories.
     */
    public empty (): boolean {
        return !this.hasRepositories
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
        this.state.save(this.persist())
    }

    /**
     * Get this project's id.
     */
    public getId (): string {
        return this.id
    }

    /**
     * Update this project's options.
     *
     * @param options The new set of options.
     */
    public updateOptions (options: ProjectOptions): void {
        // Currently only the name is editable
        this.name = options.name
        state.updateProject({ id: this.id, name: this.name })
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
     * A function to run when a child repository changes.
     */
    protected changeListener (): void {
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
                .on('change', this.changeListener.bind(this))
            this.repositories.push(repository)
            this.hasRepositories = true
            resolve(repository)
        })
    }

    /**
     * Remove a child repository from this project using its unique id.
     *
     * @param id The id of the repository to remove.
     */
    public removeRepository (id: string): void {
        const index = findIndex(this.repositories, repository => repository.getId() === id)
        if (index > -1) {
            this.repositories.splice(index, 1)
        }
        if (!this.repositories.length) {
            this.hasRepositories = false
        }
    }
}
