import * as Fs from 'fs'
import { v4 as uuid } from 'uuid'
import { findIndex, fromPairs, omit } from 'lodash'
import { ApplicationWindow } from '@main/application-window'
import { state } from '@lib/state'
import { Project as ProjectState } from '@lib/state/project'
import { ProjectEventEmitter } from '@lib/frameworks/emitter'
import { FrameworkStatus, parseFrameworkStatus } from '@lib/frameworks/status'
import { ProgressLedger } from '@lib/frameworks/progress'
import { RepositoryOptions, IRepository, Repository } from '@lib/frameworks/repository'
import { FrameworkWithContext, IFramework } from '@lib/frameworks/framework'
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
export type ProjectActiveIdentifiers = {
    framework: string | null
    repository: string | null
}

/**
 * The models currently active in a project
 */
export type ProjectActiveModels = {
    framework: IFramework | null
    repository: IRepository | null
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
    active?: ProjectActiveIdentifiers
    repositories?: Array<RepositoryOptions>
    status?: FrameworkStatus
}

export interface IProject extends ProjectEventEmitter {
    name: string
    repositories: Array<IRepository>
    status: FrameworkStatus
    selected: boolean

    getId (): string
    getIdentifier(): ProjectIdentifier
    start (): void
    refresh (): void
    stop (): Promise<any>
    reset (): Promise<any>
    isReady (): boolean
    isRunning (): boolean
    isRefreshing (): boolean
    isBusy (): boolean
    empty (): boolean
    render (): ProjectOptions
    persist (): ProjectOptions
    save (): void
    updateOptions (options: ProjectOptions): void
    delete (): Promise<void>
    addRepository (options: RepositoryOptions): Promise<IRepository>
    removeRepository (id: string): void
    getActive (): ProjectActiveModels
    setActiveFramework (framework: ProjectActiveIdentifiers['framework']): void
    getRepositoryById (id: string): IRepository | undefined
    getContextByFrameworkId (id: string): FrameworkWithContext | undefined
    getEmptyRepositories (): Array<IRepository>
    getProgressLedger (): ProgressLedger
    getProgress (): number
    emitRepositoriesToRenderer (): void
}

export class Project extends ProjectEventEmitter implements IProject {
    public name: string
    public repositories: Array<IRepository> = []
    public status: FrameworkStatus = 'loading'
    public selected = false

    protected readonly id: string
    protected state: ProjectState
    protected active: ProjectActiveIdentifiers
    protected parsed = false
    protected ready = false
    protected hasRepositories = false
    protected initialRepositoryCount = 0
    protected initialRepositoryReady = 0

    constructor (window: ApplicationWindow, identifier: ProjectIdentifier) {
        super(window)
        this.id = identifier.id || uuid()
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
     * Get this project's identifier object.
     */
    public getIdentifier (): ProjectIdentifier {
        return {
            id: this.id,
            name: this.name
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
    public async stop (): Promise<any> {
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
     * Prepares the project for sending out to renderer process.
     */
    public render (): ProjectOptions {
        return {
            id: this.id,
            name: this.name,
            active: this.active,
            status: this.status
        }
    }

    /**
     * Prepares the project for persistence.
     */
    public persist (): ProjectOptions {
        return omit({
            ...this.render(),
            repositories: this.repositories.map(repository => repository.persist())
        }, 'status')
    }

    /**
     * Save this project in the persistent store.
     */
    public save (): void {
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
        this.save()
    }

    /**
     * Delete this project.
     */
    public async delete (): Promise<void> {
        await this.stop()
        return new Promise((resolve, reject) => {
            Fs.rmdir(this.state.getPath(), { recursive: true }, error => {
                if (error) {
                    reject(error)
                    return
                }
                resolve()
            })
        })
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

        // Emit progress event, even if progress is currently zero.
        // This will allow the window to start progress count and feed back to
        // the user that the window is currently running the project, or reset
        // the progress if project is no longer running.
        this.emit('progress', this.getProgress())
    }

    /**
     * A function to run when a child repository changes.
     */
    protected changeListener (): void {
        this.save()
    }

    /**
     * A function to run when a child repository progresses.
     */
    protected progressListener (): void {
        this.emit('progress', this.getProgress())
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
        if (to !== from) {
            this.status = to
            this.emit('status', to, from)
            this.emitToRenderer(`${this.id}:status:index`, to, from)
            this.emitToRenderer(`${this.id}:status:sidebar`, to, from)
        }
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
            const repository = new Repository(this.window, options)
            repository
                .on('ready', this.onRepositoryReady.bind(this))
                .on('status', this.statusListener.bind(this))
                .on('state', this.stateListener.bind(this))
                .on('change', this.changeListener.bind(this))
                .on('progress', this.progressListener.bind(this))
            this.repositories.push(repository)
            this.hasRepositories = true
            this.updateStatus()
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
            this.repositories[index].removeAllListeners()
            this.repositories.splice(index, 1)
            this.updateStatus()
        }
        if (!this.repositories.length) {
            this.hasRepositories = false
        }
        this.save()
    }

    /**
     * Get the project's active models.
     */
    public getActive (): ProjectActiveModels {
        // If an active framework is set, attempt to return it, if it still exists.
        if (this.active.framework) {
            let framework
            for (let i = this.repositories.length - 1; i >= 0; i--) {
                framework = this.repositories[i].getFrameworkById(this.active.framework)
                if (framework) {
                    return {
                        framework,
                        repository: this.repositories[i]
                    }
                }
            }
        }

        // Otherwise, iterate through the repositories and return the first
        // available framework.
        for (let i = this.repositories.length - 1; i >= 0; i--) {
            if (this.repositories[i].frameworks.length) {
                return {
                    framework: this.repositories[i].frameworks[0],
                    repository: this.repositories[i]
                }
            }
        }

        return {
            framework: null,
            repository: null
        }
    }

    /**
     * Set the project's active framework.
     */
    public setActiveFramework (framework: ProjectActiveIdentifiers['framework']): void {
        this.active.framework = framework
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
     * Retrieve a framework and its repository from this project
     * using only the framework id.
     *
     * @param id The id of the framework to retrieve.
     */
    public getContextByFrameworkId (id: string): FrameworkWithContext | undefined {
        const map: { [key: string]: [number, number] } = fromPairs(
            this.repositories
                .map(
                    (repository, i) => repository.frameworks.map(
                        (framework, j) => [framework.getId(), [i, j]]
                    )
                )
                .flat()
        )

        if (map[id]) {
            return {
                repository: this.repositories[map[id][0]],
                framework: this.repositories[map[id][0]].frameworks[map[id][1]]
            }
        }

        return
    }

    /**
     * Get an array of repositories without frameworks.
     */
    public getEmptyRepositories (): Array<IRepository> {
        return this.repositories.filter((repository: IRepository) => repository.empty())
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

    /**
     * Send project's repositories to the renderer process.
     */
    public emitRepositoriesToRenderer (): void {
        this.emitToRenderer(`${this.id}:repositories`, this.repositories.map((repository: IRepository) => repository.render()))
    }
}
