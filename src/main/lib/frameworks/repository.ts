import { Glob } from 'glob'
import { v4 as uuid } from 'uuid'
import { findIndex } from 'lodash'
import { EventEmitter } from 'events'
import { Frameworks } from '@main/lib/frameworks'
import { FrameworkStatus, parseFrameworkStatus } from '@main/lib/frameworks/status'
import { FrameworkFactory } from '@main/lib/frameworks/factory'
import { FrameworkOptions, IFramework } from '@main/lib/frameworks/framework'

/**
 * Options to instantiate a Project with.
 */
export type RepositoryOptions = {
    id?: string,
    name?: string,
    path: string
    collapsed?: boolean
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
    readonly id: string
    readonly path: string
    readonly name: string
    frameworks: Array<IFramework>
    initialFrameworkCount: number
    initialFrameworkReady: number
    status: FrameworkStatus
    selected: boolean
    scanning: boolean
    collapsed: boolean

    start (): void
    refresh (): void
    stop (): Promise<void>
    isRunning (): boolean
    isRrefreshing (): boolean
    isBusy (): boolean
    persist (): RepositoryOptions
    save (): void
    scan (): Promise<Array<FrameworkOptions>>
    getDisplayName (): string
    toggle (): void
    addFramework (options: FrameworkOptions): Promise<IFramework>
    removeFramework (id: string): void
}

export class Repository extends EventEmitter implements IRepository {
    public readonly id: string
    public readonly path: string
    public readonly name: string
    public frameworks: Array<IFramework> = []
    public initialFrameworkCount: number = 0
    public initialFrameworkReady: number = 0
    public status: FrameworkStatus = 'loading'
    public selected: boolean = false
    public scanning: boolean = false
    public collapsed: boolean

    protected parsed: boolean = false
    protected ready: boolean = false

    constructor (options: RepositoryOptions) {
        super()
        this.id = options.id || uuid()
        this.path = options.path
        this.name = options.name || this.path.split('/').pop() || 'untitled'
        this.collapsed = options.collapsed || false
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
     * Prepares the repository for persistence.
     */
    public persist (): RepositoryOptions {
        return {
            id: this.id,
            name: this.name,
            path: this.path,
            collapsed: this.collapsed,
            frameworks: this.frameworks.map(framework => framework.persist())
        }
    }

    /**
     * Save this repository in the persistent store.
     */
    public save (): void {
        this.emit('save')
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
     * Get this repository's display name.
     */
    public getDisplayName (): string {
        return this.name
    }

    /**
     * Toggle this repository's visibility.
     */
    public toggle (): void {
        this.collapsed = !this.collapsed
        this.emit('change', this)
    }

    /**
     * A function to run when a child framework changes its status.
     */
    protected statusListener (): void {
        this.updateStatus(parseFrameworkStatus(this.frameworks.map(framework => framework.status)))
    }

    /**
     * A function to run when a child framework changes its state (i.e. runs, stops, etc).
     */
    protected stateListener (): void {
        // Cascade the event up to the project.
        this.emit('state')
    }

    /**
     * A function to run when a child framework requests saving.
     */
    protected saveListener (): void {
        this.save()
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
        this.ready = true
        if (!this.initialFrameworkCount) {
            this.updateStatus('idle')
        }
        this.emit('ready', this)
    }

    /**
     * Register loading progress.
     */
    protected onProgress (): void {
        this.emit('progress')
    }

    /**
     * Listener for when a child framework is ready.
     */
    protected onFrameworkReady (): void {
        this.emit('progress')
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
    protected updateStatus (to: FrameworkStatus): void {
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
                .on('progress', this.onProgress.bind(this))
                .on('ready', this.onFrameworkReady.bind(this))
                .on('status', this.statusListener.bind(this))
                .on('state', this.stateListener.bind(this))
                .on('save', this.saveListener.bind(this))
            this.frameworks.push(framework)
            resolve(framework)
        })
    }

    /**
     * Remove a child framework from this repository using its unique id.
     *
     * @param id The id of the framework to remove.
     */
    public removeFramework (id: string): void {
        const index = findIndex(this.frameworks, { id })
        if (index > -1) {
            this.frameworks.splice(index, 1)
        }
    }
}
