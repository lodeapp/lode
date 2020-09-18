import { v4 as uuid } from 'uuid'
import { findIndex } from 'lodash'
import { state } from '@lib/state'
import { Project as ProjectState } from '@lib/state/project'
import { ProjectEventEmitter } from '@lib/frameworks/emitter'
import { FrameworkStatus, parseFrameworkStatus } from '@lib/frameworks/status'
import { ProgressLedger } from '@lib/frameworks/progress'
import { RepositoryOptions, IRepository, Repository } from '@lib/frameworks/repository'
import { FrameworkContext, IFramework } from '@lib/frameworks/framework'
import { Nugget } from '@lib/frameworks/nugget'

/**
 * The minimal options to identify a project by.
 */
export type ProjectIdentifier = {
    id?: string
    name?: string
}

/**
 * The models currently active in a project
 */
export type ProjectActiveModels = {
    framework: string | null
}

export type ProjectEntities = {
    project: IProject
    repository: IRepository
    framework: IFramework
    nuggets?: Array<Nugget>
    nugget?: Nugget
}

/**
 * Options to instantiate a Project with.
 */
export type ProjectOptions = {
    id?: string
    name?: string
    active?: ProjectActiveModels
    repositories?: Array<RepositoryOptions>
    status?: FrameworkStatus
}

export interface IProject extends ProjectEventEmitter {
    name: string
    repositories: Array<IRepository>
    status: FrameworkStatus
    selected: boolean

    getId (): string
    start (): void
    refresh (): void
    stop (): Promise<any>
    reset (): Promise<any>
    isReady (): boolean
    isRunning (): boolean
    isRefreshing (): boolean
    isBusy (): boolean
    empty (): boolean
    persist (shallow?: boolean): ProjectOptions
    render (): ProjectOptions
    save (): void
    updateOptions (options: ProjectOptions): void
    addRepository (options: RepositoryOptions): Promise<IRepository>
    removeRepository (id: string): void
    getActive (): ProjectActiveModels
    getRepositoryById (id: string): IRepository | undefined
    getFrameworkByContext (context: FrameworkContext): IFramework | undefined
    getProgressLedger (): ProgressLedger
}

export class Project extends ProjectEventEmitter implements IProject {
    public name: string
    public repositories: Array<IRepository> = []
    public status: FrameworkStatus = 'loading'
    public selected: boolean = false

    protected readonly id: string
    protected state: ProjectState
    protected active: ProjectActiveModels
    protected parsed: boolean = false
    protected ready: boolean = false
    protected hasRepositories: boolean = false
    protected initialRepositoryCount: number = 0
    protected initialRepositoryReady: number = 0

    constructor (identifier: ProjectIdentifier) {
        super()
        this.id = identifier.id || uuid()
        console.log('INSTANTIATING PROJECT', this.id)
        this.state = state.project({ ...identifier, id: this.id })
        this.name = this.state.get('options.name')

        // Load options from the persistent project state.
        const options = this.state.get('options')
        this.initialRepositoryCount = (options.repositories || []).length
        this.hasRepositories = this.initialRepositoryCount > 0
        this.active = options.active || {
            framework: null
        }

        // If options include repositories already (i.e. persisted state), add them.
        this.loadRepositories(options.repositories || [])

        // If this project doesn't yet exist, create it.
        if (!identifier.id) {
            console.log('NO ID, SAVING')
            this.save()
        }
    }

    /**
     * Get this project's id.
     */
    public getId (): string {
        return this.id
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
    public async stop (): Promise<any> {
        console.log('GOT STOP INSTRUCTION')
        return Promise.all(this.repositories.map((repository: IRepository) => {
            return repository.stop()
        }))
    }

    /**
     * Reset this project's state.
     */
    public async reset (): Promise<any> {
        return Promise.all(this.repositories.map((repository: IRepository) => {
            return repository.reset()
        }))
    }

    /**
     * Whether this project is ready.
     */
    public isReady (): boolean {
        return this.ready
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
    public isRefreshing (): boolean {
        return this.repositories.some((repository: IRepository) => repository.isRefreshing())
    }

    /**
     * Whether this project is busy.
     */
    public isBusy (): boolean {
        return this.repositories.some((repository: IRepository) => repository.isBusy())
    }

    /**
     * Whether this project has any repositories.
     * This is used for layout purposes, so it's not enough to just rely on
     * an "empty" status, because they will render different calls-to-action.
     */
    public empty (): boolean {
        return !this.hasRepositories
    }

    /**
     * Prepares the project for persistence.
     *
     * @param shallow Whether to skip over deeply nested resources.
     */
    public persist (shallow: boolean = false): ProjectOptions {
        const persist: ProjectOptions = {
            id: this.id,
            name: this.name,
            active: this.active
        }

        if (!shallow) {
            persist.repositories = this.repositories.map(repository => shallow ? repository.render() : repository.persist())
        } else {
            persist.status = this.status
        }

        return persist
    }

    /**
     * Prepares the project for sending out to renderer process.
     */
    public render (): ProjectOptions {
        return this.persist(true)
    }

    /**
     * Save this project in the persistent store.
     */
    public save (): void {
        console.log('SAVING PROJECT', this.persist())
        this.state.save(this.persist())
    }

    /**
     * Update this project's options.
     *
     * @param options The new set of options.
     */
    public updateOptions (options: ProjectOptions): void {
        // Currently only the name is editable
        this.name = options.name || ''
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
        const isBusy = this.isBusy()
        this.state.set('busy', isBusy)
        this.emit('busy', isBusy)

        // If project is no longer busy, reset all progress ledgers.
        if (!isBusy) {
            this.repositories.forEach((repository: IRepository) => {
                repository.resetProgressLedger()
            })
        }
    }

    /**
     * A function to run when a child repository changes.
     */
    protected changeListener (): void {
        console.log('CHANGE IN PROJECT, SAVING')
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
        // Ready event will only trigger once.
        if (this.ready) {
            return
        }

        this.ready = true
        if (!this.initialRepositoryCount) {
            this.updateStatus()
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
        console.log('REPOSITORY READY, SAVING')
        this.save()
    }

    /**
     * Update this project's status.
     *
     * @param to The status we're updating to.
     */
    protected updateStatus (to?: FrameworkStatus): void {
        if (typeof to === 'undefined') {
            to = parseFrameworkStatus(this.repositories.map(repository => repository.status))
        }
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
                .on('project-event', this.projectEventListener.bind(this))
                .on('ready', this.onRepositoryReady.bind(this))
                .on('status', this.statusListener.bind(this))
                .on('state', this.stateListener.bind(this))
                .on('change', this.changeListener.bind(this))
            this.repositories.push(repository)
            this.hasRepositories = true
            this.updateStatus()
            this.emit('repositoryAdded', repository)
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
            const repositoryId = this.repositories[index].getId()
            this.repositories[index].removeAllListeners()
            this.repositories.splice(index, 1)
            this.updateStatus()
            this.emit('repositoryRemoved', repositoryId)
        }
        if (!this.repositories.length) {
            this.hasRepositories = false
        }
        console.log('REPOSITORY REMOVED, SAVING')
        this.save()
    }

    /**
     * Get the project's active models.
     */
    public getActive (): ProjectActiveModels {
        return this.active
    }

    /**
     * Retrieve a repository from this project by its id.
     *
     * @param id The id of the repository to retrieve.
     */
    public getRepositoryById (id: string): IRepository | undefined {
        const index = findIndex(this.repositories, repository => repository.getId() === id)
        if (index > -1) {
            return this.repositories[index]
        }
        return undefined
    }

    /**
     * Retrieve a framework from this project by its context (i.e. repository
     * and framework identifiers).
     *
     * @param context The context with which to search the framework.
     */
    public getFrameworkByContext (context: FrameworkContext): IFramework | undefined {
        const repository = this.getRepositoryById(context.repository)
        if (repository) {
            return repository.getFrameworkById(context.framework)
        }
        return undefined
    }

    /**
     * Return the project's progress ledger.
     */
    public getProgressLedger (): ProgressLedger {
        return this.repositories.reduce((ledger: ProgressLedger, reopsitory: IRepository) => {
            const reopsitoryLedger: ProgressLedger = reopsitory.getProgressLedger()
            ledger.run += reopsitoryLedger.run
            ledger.total += reopsitoryLedger.total
            return ledger
        }, {
            run: 0,
            total: 0
        })
    }

    /**
     * Return the project's progress.
     */
    public getProgress (): number {
        const ledger = this.getProgressLedger()
        return ledger.total ? ledger.run / ledger.total : -1
    }
}
