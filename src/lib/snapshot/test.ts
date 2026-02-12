import type { IFramework } from '@lib/frameworks/framework'
import type { Status } from '@lib/frameworks/status'
import type { ITest, ITestResult } from '@lib/frameworks/test'
import { SnapshotNugget } from '@lib/snapshot/nugget'

/**
 * A read-only test backed by snapshot data.
 * Extends SnapshotNugget so it's compatible with the entities() function
 * and ITest interface used by IPC handlers.
 */
export class SnapshotTest extends SnapshotNugget implements ITest {
    protected result!: ITestResult

    constructor(framework: IFramework, result: ITestResult) {
        super(framework)
        this.result = result
    }

    public getId(): string {
        return this.result.id
    }

    public getStatus(): Status {
        return this.framework.getNuggetStatus(this.getId()) || this.result.status || 'idle'
    }

    public getName(): string {
        return this.result.name
    }

    public getDisplayName(): string {
        return this.result.displayName || this.result.name
    }

    public render(_status?: Status | false): ITestResult {
        return this.result
    }

    public persist(_status?: Status | false): ITestResult {
        return this.result
    }

    public getResult(): ITestResult {
        return this.result
    }

    public resetResult(): void {
        // No-op in snapshot mode
    }

    public async debrief(_result: ITestResult, _cleanup: boolean): Promise<void> {}

    protected newTest(result: ITestResult): ITest {
        return new SnapshotTest(this.framework, result)
    }
}
