import { Glob } from 'glob'
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
    name?: string,
    path: string
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
    status: FrameworkStatus
    selected: boolean
    scanning: boolean

    start (): void
    refresh (): void
    stop (): Promise<void>
    persist (): RepositoryOptions
    scan (): Promise<Array<FrameworkOptions>>
    getDisplayName (): string
}

export class Repository extends EventEmitter implements IRepository {
    public readonly id: string
    public readonly path: string
    public readonly name: string
    public frameworks: Array<IFramework> = []
    public status: FrameworkStatus = 'idle'
    public selected: boolean = false
    public scanning: boolean = false

    constructor (options: RepositoryOptions) {
        super()
        this.id = options.id || uuid()
        this.path = options.path
        this.name = options.name || this.path.split('/').pop() || 'untitled'

        // If options include frameworks already (i.e. persisted state), add them.
        if (options.frameworks) {
            options.frameworks.forEach((framework: FrameworkOptions) => {
                this.addFramework(framework)
            })
        }
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
            const stopping = this.frameworks.map((framework: IFramework) => {
                return framework.stop()
            })
            Promise.all(stopping).then(() => {
                resolve()
            })
        })
    }

    /**
     * Prepares the repository for persistence.
     */
    public persist (): RepositoryOptions {
        return {
            id: this.id,
            name: this.name,
            path: this.path,
            frameworks: this.frameworks.map(framework => framework.persist())
        }
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
    public addFramework (options: FrameworkOptions): IFramework {
        const framework: IFramework = FrameworkFactory.make({ ...options, ...{ repositoryPath: this.path }})
        framework.on('status', this.statusListener.bind(this))
        this.frameworks.push(framework)
        return framework
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
