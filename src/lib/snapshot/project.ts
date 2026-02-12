import type {
    FrameworkWithContext,
} from '@lib/frameworks/framework'
import type { ProgressLedger } from '@lib/frameworks/progress'
import type {
    IProject,
    ProjectActiveIdentifiers,
    ProjectActiveModels,
    ProjectIdentifier,
    ProjectOptions,
} from '@lib/frameworks/project'
import type { IRepository, RepositoryOptions } from '@lib/frameworks/repository'
import type { FrameworkStatus } from '@lib/frameworks/status'
import type { SnapshotFramework } from '@lib/snapshot/framework'
import type { SnapshotFile } from '@lib/snapshot/types'
import type { ApplicationWindow } from '@main/application-window'
import { ProjectEventEmitter } from '@lib/frameworks/emitter'
import { parseFrameworkStatus } from '@lib/frameworks/status'
import { SnapshotRepository } from '@lib/snapshot/repository'
import { fromPairs } from 'lodash'

/**
 * A read-only project backed by snapshot data.
 * Implements IProject so it can be used interchangeably with a live Project
 * by the IPC handlers in the main process.
 */
export class SnapshotProject extends ProjectEventEmitter implements IProject {
    public name: string
    public repositories: Array<IRepository> = []
    public status: FrameworkStatus
    public selected = false

    protected id: string
    protected active: ProjectActiveIdentifiers

    constructor(window: ApplicationWindow, data: SnapshotFile) {
        super(window)
        this.id = data.project.id
        this.name = data.project.name

        // Build repositories from snapshot data
        this.repositories = data.project.repositories.map(
            repoData => new SnapshotRepository(window, repoData),
        )

        // Compute status from child repositories
        this.status = parseFrameworkStatus(this.repositories.map(r => r.status))

        // Set first framework as active
        this.active = { framework: null, repository: null }
        for (const repo of this.repositories) {
            if (repo.frameworks.length) {
                this.active.framework = repo.frameworks[0].getId()
                break
            }
        }
    }

    public getId(): string { return this.id }

    public getIdentifier(): ProjectIdentifier {
        return { id: this.id, name: this.name }
    }

    // Read-only: mutation methods are no-ops
    public start(): void {}
    public refresh(): void {}
    public async stop(): Promise<any> {}

    public async reset(): Promise<any> {
        return Promise.all(this.repositories.map(r => r.reset()))
    }

    public isReady(): boolean { return true }
    public isRunning(): boolean { return false }
    public isRefreshing(): boolean { return false }
    public isBusy(): boolean { return false }
    public empty(): boolean { return this.repositories.length === 0 }

    public render(): ProjectOptions {
        return {
            id: this.id,
            name: this.name,
            active: this.active,
            status: this.status,
        }
    }

    public persist(): ProjectOptions { return this.render() }
    public save(): void {}

    public updateOptions(_options: ProjectOptions): void {
        // No-op in snapshot mode
    }

    public async delete(): Promise<void> {
        // No-op in snapshot mode
    }

    public async addRepository(_options: RepositoryOptions): Promise<IRepository> {
        throw new Error('Cannot add repositories in snapshot mode')
    }

    public removeRepository(_id: string): void {
        // No-op in snapshot mode
    }

    public getActive(): ProjectActiveModels {
        if (this.active.framework) {
            for (let i = this.repositories.length - 1; i >= 0; i--) {
                const framework = this.repositories[i].getFrameworkById(this.active.framework)
                if (framework) {
                    return { framework, repository: this.repositories[i] }
                }
            }
        }

        for (let i = this.repositories.length - 1; i >= 0; i--) {
            if (this.repositories[i].frameworks.length) {
                return {
                    framework: this.repositories[i].frameworks[0],
                    repository: this.repositories[i],
                }
            }
        }

        return { framework: null, repository: null }
    }

    public setActiveFramework(framework: ProjectActiveIdentifiers['framework']): void {
        this.active.framework = framework
    }

    public getRepositoryById(id: string): IRepository | undefined {
        return this.repositories.find(repository => repository.getId() === id)
    }

    public getContextByFrameworkId(id: string): FrameworkWithContext | undefined {
        const map: { [key: string]: [number, number] } = fromPairs(
            this.repositories
                .map(
                    (repository, i) => repository.frameworks.map(
                        (framework, j) => [framework.getId(), [i, j]],
                    ),
                )
                .flat(),
        )

        if (map[id]) {
            return {
                repository: this.repositories[map[id][0]],
                framework: this.repositories[map[id][0]].frameworks[map[id][1]],
            }
        }

        return undefined
    }

    public getEmptyRepositories(): Array<IRepository> {
        return this.repositories.filter(r => r.empty())
    }

    public getProgressLedger(): ProgressLedger { return { run: 0, total: 0 } }
    public getProgress(): number { return 1 }

    public emitRepositoriesToRenderer(): void {
        this.emitToRenderer(
            `${this.id}:repositories`,
            this.repositories.map(r => r.render()),
        )
    }

    /**
     * Emit all static data to the renderer for initial load.
     * This replaces the live project's asynchronous loading flow
     * with a single synchronous emission of all snapshot data.
     */
    public emitAllToRenderer(): void {
        // Emit repositories
        this.emitRepositoriesToRenderer()

        // Emit status
        this.emitToRenderer(`${this.id}:status:index`, this.status)

        // For each repository, emit frameworks and status
        for (const repo of this.repositories) {
            (repo as unknown as SnapshotRepository).emitStatusToRenderer()
            repo.emitFrameworksToRenderer()

            // For each framework, emit suites, ledger, and status
            for (const fw of repo.frameworks) {
                const snapshotFw = fw as SnapshotFramework
                snapshotFw.emitSuitesToRenderer()
                snapshotFw.emitLedgerToRenderer()
                snapshotFw.emitStatusToRenderer()
            }
        }
    }
}
