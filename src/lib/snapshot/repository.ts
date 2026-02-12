import type { FrameworkOptions, IFramework } from '@lib/frameworks/framework'
import type { ProgressLedger } from '@lib/frameworks/progress'
import type { IRepository, RepositoryOptions } from '@lib/frameworks/repository'
import type { FrameworkStatus } from '@lib/frameworks/status'
import type { SnapshotRepositoryData } from '@lib/snapshot/types'
import type { ApplicationWindow } from '@main/application-window'
import { ProjectEventEmitter } from '@lib/frameworks/emitter'
import { parseFrameworkStatus } from '@lib/frameworks/status'
import { SnapshotFramework } from '@lib/snapshot/framework'

/**
 * A read-only repository backed by snapshot data.
 */
export class SnapshotRepository extends ProjectEventEmitter implements IRepository {
    public frameworks: Array<IFramework> = []
    public status: FrameworkStatus
    public selected = false
    public scanning = false

    protected id: string
    protected path: string
    protected name: string
    protected expanded = true

    constructor(window: ApplicationWindow, data: SnapshotRepositoryData) {
        super(window)
        this.id = data.id
        this.name = data.name
        this.path = data.path

        // Build frameworks from snapshot data
        this.frameworks = data.frameworks.map(
            fwData => new SnapshotFramework(window, this.path, fwData),
        )

        // Compute status from child frameworks
        this.status = parseFrameworkStatus(this.frameworks.map(f => f.status))
    }

    public getId(): string { return this.id }
    public getName(): string { return this.name }
    public setName(_name: string): void { /* No-op in snapshot mode */ }
    public getDisplayName(): string { return this.name }
    public getPath(): string { return this.path }

    // Read-only: mutation methods are no-ops
    public start(): void {}
    public refresh(): void {}
    public async stop(): Promise<any> {}
    public async reset(): Promise<any> {
        return Promise.all(this.frameworks.map(f => f.reset()))
    }

    public save(): void {}
    public async scan(): Promise<Array<FrameworkOptions>> { return [] }
    public expand(): void { this.expanded = true }
    public collapse(): void { this.expanded = false }

    public isRunning(): boolean { return false }
    public isRefreshing(): boolean { return false }
    public isBusy(): boolean { return false }
    public empty(): boolean { return this.frameworks.length === 0 }
    public count(): number { return this.frameworks.length }
    public isExpanded(): boolean { return this.expanded }

    public render(): RepositoryOptions {
        return {
            id: this.id,
            name: this.name,
            path: this.path,
            status: this.status,
            expanded: this.expanded,
        }
    }

    public persist(): RepositoryOptions { return this.render() }

    public async addFramework(_options: FrameworkOptions): Promise<IFramework> {
        throw new Error('Cannot add frameworks in snapshot mode')
    }

    public removeFramework(_id: string): void {
        // No-op in snapshot mode
    }

    public getFrameworkById(id: string): IFramework | undefined {
        return this.frameworks.find(framework => framework.getId() === id)
    }

    public async getBranch(): Promise<string | null> { return null }
    public async exists(): Promise<boolean> { return true }
    public async locate(_window: Electron.BrowserWindow): Promise<void> {}

    public getProgressLedger(): ProgressLedger { return { run: 0, total: 0 } }
    public resetProgressLedger(): void {}

    public emitFrameworksToRenderer(): void {
        this.emitToRenderer(`${this.id}:frameworks`, this.frameworks.map(f => f.render()))
    }

    /**
     * Emit static status to the renderer.
     */
    public emitStatusToRenderer(): void {
        this.emitToRenderer(`${this.id}:status:sidebar`, this.status)
    }
}
