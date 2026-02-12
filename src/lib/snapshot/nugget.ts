import type { IFramework } from '@lib/frameworks/framework'
import { Nugget } from '@lib/frameworks/nugget'

/**
 * Base class for read-only nuggets backed by snapshot data.
 * Consolidates the no-op overrides shared by SnapshotSuite and SnapshotTest.
 */
export abstract class SnapshotNugget extends Nugget {
    constructor(framework: IFramework) {
        super(framework)
        this.expanded = false
    }

    /**
     * No-op: snapshot nuggets cannot be selected.
     */
    public async toggleSelected(_toggle?: boolean, _cascade?: boolean): Promise<void> {}

    public setFresh(_fresh: boolean): void {}
    public isFresh(): boolean { return false }

    /**
     * Toggle expanded state. Unlike the live Nugget, snapshot nuggets
     * never call wither() since the data is static and shouldn't be discarded.
     */
    public async toggleExpanded(toggle?: boolean, cascade?: boolean): Promise<void> {
        this.expanded = typeof toggle === 'undefined' ? !this.expanded : toggle
        if (this.expanded) {
            await this.bloom()
        }
        if (cascade !== false) {
            this.tests.forEach((test) => {
                test.toggleExpanded(this.expanded)
            })
        }
    }
}
