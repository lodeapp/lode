import { Glob } from 'glob'
import { pathExistsSync } from 'fs-extra'
import { v4 as uuid } from 'uuid'
import { findIndex } from 'lodash'
import { EventEmitter } from 'events'
import { Frameworks } from '@lib/frameworks'
import { FrameworkStatus, parseFrameworkStatus } from '@lib/frameworks/status'
import { FrameworkFactory } from '@lib/frameworks/factory'
import { FrameworkOptions, IFramework } from '@lib/frameworks/framework'

/**
 * Options to instantiate a Project with.
 */
export type RepositoryOptions = {
    id?: string,
    name?: string
    path: string
    expanded?: boolean
    frameworks?: Array<FrameworkOptions>
}

/**
 * Standardised repository information (e.g. used for scanning
 * for test frameworks).
 */
export type ParsedRepository = {
    path: string
    files: Array<string>
}

export interface IRepository extends EventEmitter {
    frameworks: Array<IFramework>
    status: FrameworkStatus
    selected: boolean
    scanning: boolean

    getId (): string
    getDisplayName (): string
    start (): void
    refresh (): void
    stop (): Promise<void>
    save (): void
    scan (): Promise<Array<FrameworkOptions>>
    toggle (): void
    isRunning (): boolean
    isRrefreshing (): boolean
    isBusy (): boolean
    isExpanded (): boolean
    persist (): RepositoryOptions
    addFramework (options: FrameworkOptions): Promise<IFramework>
    removeFramework (id: string): void
    getFrameworkById (id: string): IFramework | undefined
    getPath (): string
    updatePath (path: string): void
    exists (): boolean
}

export class Repository extends EventEmitter implements IRepository {
    public frameworks: Array<IFramework> = []
    public status: FrameworkStatus = 'loading'
    public selected: boolean = false
    public scanning: boolean = false

    protected id: string
    protected path: string
    protected name: string
    protected expanded: boolean
    protected parsed: boolean = false
    protected ready: boolean = false
    protected initialFrameworkCount: number = 0
    protected initialFrameworkReady: number = 0

    constructor (options: RepositoryOptions) {
        super()
        this.id = options.id || uuid()
        this.path = options.path
        this.name = options.name || this.path.split('/').pop() || 'untitled'
        this.expanded = typeof options.expanded === 'undefined' ? true : options.expanded
        this.initialFrameworkCount = (options.frameworks || []).length

        // If options include frameworks already (i.e. persisted state), add them.
        this.loadFrameworks(options.frameworks || [])
    }

    /**
     * Run all of this repository's test frameworks.
     */
    public start (): void {
        this.frameworks.forEach((framework: IFramework) => {
            framework.start()
        })
    }

    /**
     * Refresh all of this repository's test frameworks.
     */
    public refresh (): void {
        this.frameworks.forEach((framework: IFramework) => {
            framework.refresh()
        })
    }

    /**
     * Stop any test framework in this repository that might be running.
     */
    public stop (): Promise<void> {
        return new Promise((resolve, reject) => {
            Promise.all(this.frameworks.map((framework: IFramework) => {
                return framework.stop()
            })).then(() => {
                resolve()
            })
        })
    }

    /**
     * Whether this repository is running.
     */
    public isRunning (): boolean {
        return this.frameworks.some((framework: IFramework) => framework.isRunning())
    }

    /**
     * Whether this repository is refreshing.
     */
    public isRrefreshing (): boolean {
        return this.frameworks.some((framework: IFramework) => framework.isRrefreshing())
    }

    /**
     * Whether this repository is busy.
     */
    public isBusy (): boolean {
        return this.frameworks.some((framework: IFramework) => framework.isBusy())
    }

    /**
     * Whether this repository is expanded.
     */
    public isExpanded (): boolean {
        return this.expanded
    }

    /**
     * Prepares the repository for persistence.
     */
    public persist (): RepositoryOptions {
        return {
            id: this.id,
            name: this.name,
            path: this.path,
            expanded: this.expanded,
            frameworks: this.frameworks.map(framework => framework.persist())
        }
    }

    /**
     * Save this repository in the persistent store.
     */
    public save (): void {
        this.emit('change')
    }

    /**
     * Scan the repository folder for testing frameworks.
     */
    public scan (): Promise<Array<FrameworkOptions>> {
        this.scanning = true
        const scanned: Array<FrameworkOptions> = []
        const glob = new Glob('*', {
            cwd: this.path,
            dot: true,
            sync: true
        })
        return new Promise((resolve, reject) => {
            Frameworks.forEach(framework => {
                const options = framework.spawnForDirectory({
                    path: this.path,
                    files: glob.found
                })
                if (options) {
                    scanned.push({ ...options, ...{ scanStatus: 'pending' }})
                }
            })
            resolve(scanned)
            this.scanning = false
        })
    }

    /**
     * Get this repository's id.
     */
    public getId (): string {
        return this.id
    }

    /**
     * Get this repository's display name.
     */
    public getDisplayName (): string {
        return this.name
    }

    /**
     * Toggle this repository's visibility.
     */
    public toggle (): void {
        this.expanded = !this.expanded
        this.emit('change', this)
    }

    /**
     * A function to run when a child framework changes its status.
     */
    protected statusListener (): void {
        this.updateStatus()
    }

    /**
     * A function to run when a child framework changes its state (i.e. runs, stops, etc).
     */
    protected stateListener (): void {
        // Cascade the event up to the project.
        this.emit('state')
    }

    /**
     * A function to run when a child framework changes.
     */
    protected changeListener (): void {
        this.save()
    }

    /**
     * A function to run when a child framework errors out.
     */
    protected errorListener (): void {
        this.exists()
    }

    /**
     * Prepare the repository for parsed state.
     */
    protected onParsed (): void {
        this.parsed = true
        if (!this.initialFrameworkCount) {
            this.onReady()
        }
        this.emit('parsed', this)
    }

    /**
     * Prepare the repository for ready state.
     */
    protected onReady (): void {
        // Ready event will only trigger once.
        if (this.ready) {
            return
        }

        this.ready = true
        if (!this.initialFrameworkCount) {
            this.updateStatus()
        }
        this.emit('ready', this)
    }

    /**
     * Listener for when a child framework is ready.
     */
    protected onFrameworkReady (): void {
        this.initialFrameworkReady++
        if (this.initialFrameworkReady >= this.initialFrameworkCount) {
            this.onReady()
        }
    }

    /**
     * Update this repository's status.
     *
     * @param to The status we're updating to.
     */
    protected updateStatus (to?: FrameworkStatus): void {
        if (typeof to === 'undefined') {
            to = parseFrameworkStatus(this.frameworks.map(framework => framework.status))
        }
        const from = this.status
        this.status = to
        this.emit('status', to, from)
    }

    /**
     * Load a group of frameworks to this project on first instantiation.
     *
     * @param frameworks The frameworks to add to this project.
     */
    protected async loadFrameworks (frameworks: Array<FrameworkOptions>): Promise<void> {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                Promise.all(frameworks.map((framework: FrameworkOptions) => {
                    return this.addFramework(framework)
                })).then(() => {
                    this.onParsed()
                    resolve()
                })
            })
        })
    }

    /**
     * Add a child framework to this repository.
     *
     * @param options The options of the framework we're adding.
     */
    public async addFramework (options: FrameworkOptions): Promise<IFramework> {
        return new Promise((resolve, reject) => {
            const framework: IFramework = FrameworkFactory.make({ ...options, ...{ repositoryPath: this.path }})
            framework
                .on('ready', this.onFrameworkReady.bind(this))
                .on('status', this.statusListener.bind(this))
                .on('state', this.stateListener.bind(this))
                .on('change', this.changeListener.bind(this))
                .on('error', this.errorListener.bind(this))
            this.frameworks.push(framework)
            this.updateStatus()
            this.emit('frameworkAdded', framework)
            resolve(framework)
        })
    }

    /**
     * Remove a child framework from this repository using its unique id.
     *
     * @param id The id of the framework to remove.
     */
    public removeFramework (id: string): void {
        const index = findIndex(this.frameworks, framework => framework.getId() === id)
        if (index > -1) {
            const frameworkId = this.frameworks[index].getId()
            this.frameworks[index].removeAllListeners()
            this.frameworks.splice(index, 1)
            this.updateStatus()
            this.emit('frameworkRemoved', frameworkId)
        }
    }

    /**
     * Retrieve a framework from this repository by its id.
     *
     * @param id The id of the framework to retrieve.
     */
    public getFrameworkById (id: string): IFramework | undefined {
        const index = findIndex(this.frameworks, framework => framework.getId() === id)
        if (index > -1) {
            return this.frameworks[index]
        }
        return undefined
    }

    /**
    * Get this repository's path.
    */
    public getPath (): string {
        return this.path
    }

    /**
     * Update the repository's path.
     */
    public updatePath (path: string): void {
        this.path = path
        this.frameworks.forEach((framework: IFramework) => {
            framework.updateOptions({
                ...framework.persist(),
                ...{ repositoryPath: path }
            })
        })
        this.updateStatus()
        this.save()
    }

    /**
     * Whether the repository exists in the filesystem
     */
    public exists (): boolean {
        const exists = pathExistsSync(this.path)
        this.updateStatus(exists ? undefined : 'missing')
        return exists
    }
}
