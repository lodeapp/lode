import type {
    FrameworkFilter,
    FrameworkOptions,
    IFramework,
    SuiteList,
} from '@lib/frameworks/framework'
import type { ProgressLedger } from '@lib/frameworks/progress'
import type { FrameworkSort } from '@lib/frameworks/sort'
import type { FrameworkStatus, Status, StatusLedger, StatusMap } from '@lib/frameworks/status'
import type { ISuite } from '@lib/frameworks/suite'
import type { SnapshotFrameworkData } from '@lib/snapshot/types'
import type { ApplicationWindow } from '@main/application-window'
import * as Path from 'node:path'
import { ProjectEventEmitter } from '@lib/frameworks/emitter'
import { parseStatus } from '@lib/frameworks/status'
import { SnapshotSuite } from '@lib/snapshot/suite'
import fuzzy from 'fuzzysearch'
import { trim } from 'lodash'

/**
 * A read-only framework backed by snapshot data.
 * Holds pre-loaded suites and statuses; mutation methods are no-ops.
 */
export class SnapshotFramework extends ProjectEventEmitter implements IFramework {
    public name: string
    public type: string
    public path: string
    public repositoryPath: string
    public fullPath: string
    public runsInRemote: boolean
    public remotePath: string | null
    public status: FrameworkStatus
    public readonly canToggleTests: boolean

    protected id: string
    protected suites: ISuite[] = []
    protected ledger: StatusLedger
    protected statuses: StatusMap
    protected proprietary: any
    protected active = true
    protected filters: { keyword: string | null, status: string[] | null, group: string | null } = {
        keyword: null,
        status: null,
        group: null,
    }

    constructor(window: ApplicationWindow, repositoryPath: string, data: SnapshotFrameworkData) {
        super(window)
        this.id = data.id
        this.name = data.name
        this.type = data.type
        this.path = data.path
        this.repositoryPath = repositoryPath
        this.fullPath = Path.join(repositoryPath, data.path)
        this.runsInRemote = data.runsInRemote ?? false
        this.remotePath = data.remotePath ?? null
        this.canToggleTests = data.canToggleTests
        this.ledger = data.ledger
        this.statuses = data.statuses
        this.proprietary = data.proprietary

        // Compute status from the statuses map (suite.persist() doesn't include
        // a status field, so s.status is only a fallback for hand-crafted data).
        this.status = parseStatus(
            data.suites.map(s => data.statuses[s.file] || s.status || 'idle'),
        ) as FrameworkStatus

        // Build suites from snapshot data
        this.suites = data.suites.map(suiteResult => new SnapshotSuite(this, suiteResult))
    }

    public getId(): string { return this.id }
    public getDisplayName(): string { return this.name }
    public getRemotePath(): string { return this.remotePath || '' }
    public getFullRemotePath(): string { return '' }

    // Read-only: mutation methods are no-ops
    public start(): void {}
    public refresh(): void {}
    public async stop(): Promise<any> {}
    public async reset(): Promise<any> { this.resetFilters() }
    public isRunning(): boolean { return false }
    public isRefreshing(): boolean { return false }
    public isBusy(): boolean { return false }
    public save(): void {}
    public async updateOptions(): Promise<void> {}
    public setActive(active: boolean): void { this.active = active }
    public isActive(): boolean { return this.active }
    public isSelective(): boolean { return false }

    public empty(): boolean { return this.suites.length === 0 }
    public count(): number { return this.suites.length }

    public render(): FrameworkOptions {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            command: '',
            path: this.path,
            runsInRemote: this.runsInRemote,
            remotePath: this.remotePath ?? undefined,
            active: this.active,
            status: this.status,
            proprietary: this.proprietary,
            sort: {} as FrameworkSort,
            selected: 0,
            canToggleTests: this.canToggleTests,
        }
    }

    public persist(): FrameworkOptions { return this.render() }

    public getAllSuites(): Array<ISuite> { return this.suites }

    public getSuites(): Array<ISuite> {
        if (!this.hasFilters()) {
            return this.getAllSuites()
        }

        const exact = this.filters.keyword && (this.filters.keyword as string).match(/^['"].+['"]$/g)
        const keyword = this.getFilterKeyword()
        return this.suites.filter((suite: ISuite) => {
            let match = true
            if (keyword) {
                if (exact) {
                    match = suite.getFilePath().toUpperCase().includes(keyword)
                }
                else {
                    match = fuzzy(keyword, suite.getDisplayName().toUpperCase())
                }
            }
            if (this.filters.status) {
                match = match && !(
                    !this.filters.status.includes(suite.getStatus())
                    && !['queued', 'running'].includes(suite.getStatus())
                )
            }
            return match
        })
    }

    public getSuiteById(id: string): ISuite | undefined {
        return this.suites.find(suite => suite.getId() === id)
    }

    public getSelected(): SuiteList { return { suites: [] } }

    public emitSuitesToRenderer(): void {
        this.emitToRenderer(
            `${this.id}:refreshed`,
            this.getSuites().map((suite: ISuite) => suite.render(false)),
            this.count(),
        )
    }

    public setFilter(filter: FrameworkFilter, value: Array<string> | string | null): void {
        (this.filters as Record<string, Array<string> | string | null>)[filter] = Array.isArray(value) ? (value.length ? value : null) : value
        this.emitSuitesToRenderer()
    }

    public getFilter(filter: FrameworkFilter): Array<string> | string | null {
        return this.filters[filter]
    }

    public hasFilters(): boolean {
        return Object.values(this.filters).some(value => !!value)
    }

    public resetFilters(): void {
        this.filters = { keyword: null, status: null, group: null }
        this.emitSuitesToRenderer()
    }

    public getLedger(): StatusLedger { return this.ledger }
    public getStatusMap(): StatusMap { return this.statuses }

    public getNuggetStatus(id: string): Status {
        return this.statuses[id] || 'idle'
    }

    public setNuggetStatus(_id: string, _to: Status, _from: Status, _updateLedger: boolean): void {
        // No-op in snapshot mode
    }

    public getProgressLedger(): ProgressLedger { return { run: 0, total: 0 } }
    public resetProgressLedger(): void {}

    public processFeedbackText(text: string): string { return text }

    /**
     * Emit static ledger and status data to the renderer.
     */
    public emitLedgerToRenderer(): void {
        this.emitToRenderer(`${this.id}:ledger`, this.ledger, this.statuses)
    }

    /**
     * Emit static status to the renderer.
     */
    public emitStatusToRenderer(): void {
        this.emitToRenderer(`${this.id}:status:sidebar`, this.status)
        this.emitToRenderer(`${this.id}:status:list`, this.status)
    }

    protected getFilterKeyword(): string | null {
        if (!this.filters.keyword) {
            return null
        }
        return trim(this.filters.keyword, `"'/\\`).toUpperCase()
    }
}
