import * as Fs from 'fs'
import * as Path from 'path'
import { Glob } from 'glob'
import { dialog } from 'electron'
import { v4 as uuid } from 'uuid'
import { findIndex, omit } from 'lodash'
import { ApplicationWindow } from '@main/application-window'
import { Frameworks } from '@lib/frameworks'
import { ProjectEventEmitter } from '@lib/frameworks/emitter'
import { FrameworkStatus, parseFrameworkStatus } from '@lib/frameworks/status'
import { ProgressLedger } from '@lib/frameworks/progress'
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
    status?: FrameworkStatus
}

/**
 * Standardised repository information (e.g. used for scanning
 * for test frameworks).
 */
export type ParsedRepository = {
    path: string
    files: Array<string>
}

export interface IRepository extends ProjectEventEmitter {
    frameworks: Array<IFramework>
    status: FrameworkStatus
    selected: boolean
    scanning: boolean

    getId (): string
    getDisplayName (): string
    start (): void
    refresh (): void
    stop (): Promise<any>
    reset (): Promise<any>
    save (): void
    scan (): Promise<Array<FrameworkOptions>>
    expand (): void
    collapse (): void
    isRunning (): boolean
    isRefreshing (): boolean
    isBusy (): boolean
    empty (): boolean
    count (): number
    isExpanded (): boolean
    render (): RepositoryOptions
    persist (): RepositoryOptions
    addFramework (options: FrameworkOptions): Promise<IFramework>
    removeFramework (id: string): void
    getFrameworkById (id: string): IFramework | undefined
    getPath (): string
    exists (): Promise<boolean>
    locate (window: Electron.BrowserWindow): Promise<void>
    getProgressLedger (): ProgressLedger
    resetProgressLedger (): void
    emitFrameworksToRenderer (): void
}

export class Repository extends ProjectEventEmitter implements IRepository {
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
    protected progressLedger: ProgressLedger = {
        run: 0,
        total: 0
    }

    constructor (window: ApplicationWindow, options: RepositoryOptions) {
        super(window)
        this.id = options.id || uuid()
        this.path = options.path
        this.name = options.name || Path.basename(this.path) || 'untitled'
        this.expanded = typeof options.expanded === 'undefined' ? true : options.expanded
        this.initialFrameworkCount = (options.frameworks || []).length
        this.exists()

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
    public stop (): Promise<any> {
        return Promise.all(this.frameworks.map((framework: IFramework): Promise<void> => {
            return new Promise((resolve, reject) => {
                framework.once('disassembled', () => {
                    resolve()
                })
                framework.stop()
            })
        }))
    }

    /**
     * Reset this repository's state.
     */
    public async reset (): Promise<any> {
        return Promise.all(this.frameworks.map((framework: IFramework) => {
            return framework.reset()
        }))
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
    public isRefreshing (): boolean {
        return this.frameworks.some((framework: IFramework) => framework.isRefreshing())
    }

    /**
     * Whether this repository is busy.
     */
    public isBusy (): boolean {
        return this.frameworks.some((framework: IFramework) => framework.isBusy())
    }

    /**
     * How many frameworks the repository currently has.
     */
    public count (): number {
        return this.frameworks.length
    }

    /**
     * Whether this repository has any frameworks.
     */
    public empty (): boolean {
        return this.count() === 0
    }

    /**
     * Whether this repository is expanded.
     */
    public isExpanded (): boolean {
        return this.expanded
    }

    /**
     * Prepares the repository for sending out to renderer process.
     */
    public render (): RepositoryOptions {
        return {
            id: this.id,
            name: this.name,
            path: this.path,
            status: this.status,
            expanded: this.expanded
        }
    }

    /**
     * Prepares the repository for persistence.
     */
    public persist (): RepositoryOptions {
        return omit({
            ...this.render(),
            frameworks: this.frameworks.map(framework => framework.persist())
        }, 'status')
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
    public async scan (): Promise<Array<FrameworkOptions>> {
        this.scanning = true
        const glob = new Glob('*', {
            cwd: this.path,
            dot: true,
            sync: true
        })
        return new Promise(async (resolve, reject) => {
            const frameworks: Array<FrameworkOptions | false> = await Promise.all(Frameworks.map(framework => {
                return framework.spawnForDirectory({
                    path: this.path,
                    files: glob.found
                })
            }))

            resolve(frameworks.filter(options => !!options).map(options => {
                return <FrameworkOptions>{
                    ...options,
                    scanStatus: 'pending'
                }
            }))
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
     * Expand this repository.
     */
    public expand (): void {
        this.expanded = true
        this.emit('change', this)
    }

    /**
     * Collapse this repository.
     */
    public collapse (): void {
        this.expanded = false
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
     * A function to run when a child framework starts measuring progress.
     */
    protected measuringListener (frameworkLedger: ProgressLedger): void {
        this.progressLedger.total += frameworkLedger.total
    }

    /**
     * A function to run when a child framework progresses.
     */
    protected progressListener (): void {
        this.progress()
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
        // If repository is marked as missing, don't update status until
        // the `exists` method is called and filesystem is checked.
        if (this.status === 'missing') {
            return
        }

        if (typeof to === 'undefined') {
            to = parseFrameworkStatus(this.frameworks.map(framework => framework.status))
        }
        const from = this.status
        if (to !== from) {
            this.status = to
            this.emit('status', to, from)
            this.emitToRenderer(`${this.id}:status:sidebar`, to, from)
        }
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
            const framework: IFramework = FrameworkFactory.make(this.window, { ...options, ...{ repositoryPath: this.path }})
            framework
                .on('ready', this.onFrameworkReady.bind(this))
                .on('status', this.statusListener.bind(this))
                .on('state', this.stateListener.bind(this))
                .on('change', this.changeListener.bind(this))
                .on('error', this.errorListener.bind(this))
                .on('measuring', this.measuringListener.bind(this))
                .on('progress', this.progressListener.bind(this))
            this.frameworks.push(framework)
            this.updateStatus()
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
            this.frameworks[index].removeAllListeners()
            this.frameworks.splice(index, 1)
            this.updateStatus()
            this.save()
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
    protected async updatePath (path: string): Promise<void> {
        this.path = path
        await Promise.all(this.frameworks.map((framework: IFramework) => {
            return framework.updateOptions({
                ...framework.persist(),
                ...{ repositoryPath: path }
            })
        }))
        await this.exists()
        this.save()
    }

    /**
     * Whether the repository exists in the filesystem
     */
    public async exists (): Promise<boolean> {
        return new Promise((resolve, reject) => {
            Fs.access(this.path, Fs.constants.R_OK, error => {
                this.status = 'loading'
                this.updateStatus(error ? 'missing' : undefined)
                resolve(!error)
            })
        })
    }

    /**
     * Locate this repository, if missing.
     */
    public async locate (window: Electron.BrowserWindow): Promise<void> {
        const { filePaths } = await dialog.showOpenDialog(window, {
            properties: ['openDirectory', 'multiSelections']
        })

        if (!filePaths || !filePaths.length) {
            return
        }
        this.updatePath(filePaths[0])
    }

    /**
     * Progress the ledger by one unit.
     */
    protected progress(): void {
        this.progressLedger.run++
        this.emit('progress')
    }

    /**
     * Return the framework's progress ledger.
     */
    public getProgressLedger (): ProgressLedger {
        return this.progressLedger
    }

    /**
     * Reset the framework's progress ledger.
     */
    public resetProgressLedger (): void {
        this.progressLedger = {
            run: 0,
            total: 0
        }
        this.frameworks.forEach((framework: IFramework) => {
            framework.resetProgressLedger()
        })
    }

    /**
     * Send repository's frameworks to the renderer process.
     */
    public emitFrameworksToRenderer (): void {
        this.emitToRenderer(`${this.id}:frameworks`, this.frameworks.map(framework => framework.render()))
    }
}
