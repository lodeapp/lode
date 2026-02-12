import type { IFramework } from '@lib/frameworks/framework'
import type { Status } from '@lib/frameworks/status'
import type { ISuite, ISuiteResult } from '@lib/frameworks/suite'
import type { ITest, ITestResult } from '@lib/frameworks/test'
import * as Path from 'node:path'
import { parseStatus } from '@lib/frameworks/status'
import { SnapshotNugget } from '@lib/snapshot/nugget'
import { SnapshotTest } from '@lib/snapshot/test'
import { omit, trimStart } from 'lodash'

/**
 * A read-only suite backed by snapshot data.
 * Extends SnapshotNugget so it's compatible with the entities() function
 * and ISuite interface used by IPC handlers.
 */
export class SnapshotSuite extends SnapshotNugget implements ISuite {
    public file: string
    protected result!: ISuiteResult

    constructor(framework: IFramework, result: ISuiteResult) {
        super(framework)
        this.file = result.file
        this.result = result
    }

    public getId(): string {
        return this.file
    }

    public getFile(): string {
        return this.file
    }

    public getFilePath(): string {
        if (!this.framework.runsInRemote) {
            return this.file
        }
        return Path.join(
            this.framework.fullPath,
            Path.relative(
                Path.join(this.framework.getRemotePath(), this.framework.path),
                this.file,
            ),
        )
    }

    public getRelativePath(): string {
        return this.framework.runsInRemote && (!this.framework.getRemotePath() || this.framework.getRemotePath() === '/')
            ? trimStart(this.file, '/')
            : Path.relative(
                    this.framework.runsInRemote
                        ? (Path.join(this.framework.getRemotePath(), this.framework.path))
                        : this.framework.fullPath,
                    this.file,
                )
    }

    public getFilePathRelativeToBase(): string {
        if (!this.framework.runsInRemote) {
            return Path.join(this.framework.path, Path.relative(this.framework.fullPath, this.file))
        }
        return Path.relative(this.framework.getRemotePath(), this.file)
    }

    public getDisplayName(): string {
        return this.getRelativePath()
    }

    public getStatus(): Status {
        return this.framework.getNuggetStatus(this.getId()) || 'idle'
    }

    public getNuggetIds(_selective: boolean): Array<string> {
        const ids: string[] = [this.getId()]
        const collectIds = (tests: ITestResult[]): void => {
            for (const test of tests) {
                ids.push(test.id)
                if (test.tests) {
                    collectIds(test.tests)
                }
            }
        }
        collectIds(this.result.tests || [])
        return ids
    }

    public getMeta(): any {
        return this.result.meta || null
    }

    public resetMeta(): void {
        // No-op in snapshot mode
    }

    public getConsole(): Array<any> | null {
        return this.result.console || null
    }

    public getFramework(): IFramework {
        return this.framework
    }

    public testsLoaded(): boolean {
        return this.result.testsLoaded || false
    }

    public async rebuildTests(_result: ISuiteResult): Promise<void> {
        // No-op in snapshot mode
    }

    public canBeOpened(): boolean {
        return false
    }

    public open(): void {
        // No-op in snapshot mode
    }

    public canToggleTests(): boolean {
        return false
    }

    public async debrief(_result: ISuiteResult, _selective: boolean): Promise<void> {
        // No-op in snapshot mode
    }

    public render(_status?: Status | false): ISuiteResult {
        return {
            file: this.file,
            meta: this.getMeta(),
            hasChildren: this.testsLoaded() && this.hasChildren(),
            selected: this.selected,
            partial: this.partial,
            relative: this.getRelativePath(),
        }
    }

    public persist(_status?: Status | false): ISuiteResult {
        return omit({
            ...this.render(),
            testsLoaded: this.testsLoaded(),
            tests: this.result.tests,
        }, ['hasChildren', 'selected', 'partial', 'relative'])
    }

    public getRunningOrder(): number | null { return null }

    protected newTest(result: ITestResult): ITest {
        return new SnapshotTest(this.framework, result)
    }

    protected getStatus2(): Status {
        if (!this.testsLoaded()) {
            return 'idle'
        }
        return parseStatus(
            this.tests.length
                ? this.tests.map(test => this.framework.getNuggetStatus(test.getId()))
                : (this.result.tests || []).map(test => this.framework.getNuggetStatus(test.id)),
        )
    }
}
