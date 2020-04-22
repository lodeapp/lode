import { get } from 'lodash'
import { Status } from '@lib/frameworks/status'
import { Nugget } from '@lib/frameworks/nugget'

export interface ITest extends Nugget {
    result?: ITestResult
    selected: boolean

    getId (): string
    getStatus (): Status
    getName (): string
    getDisplayName (): string
    getConsole (): Array<any>
    toggleSelected (toggle?: boolean, cascade?: boolean): Promise<void>
    toggleExpanded (toggle?: boolean, cascade?: boolean): Promise<void>
    persist (status?: Status | false): ITestResult
    resetResult (): void
    idle (selective: boolean): void
    queue (selective: boolean): void
    error (selective: boolean): void
    idleQueued (selective: boolean): void
    errorQueued (selective: boolean): void
    debrief (result: ITestResult, cleanup: boolean): Promise<void>
    countChildren (): number
    hasChildren(): boolean
    contextMenu (): Array<Electron.MenuItemConstructorOptions>
    getLastUpdated (): string | null
    getLastRun (): string | null
    getTotalDuration (): number
    getMaxDuration (): number
}

export interface ITestResult {
    id: string
    name: string
    displayName: string
    status: Status
    feedback?: string | object
    console?: Array<any>
    params?: string
    stats?: object
    isLast?: boolean
    tests?: Array<ITestResult>
}

export class Test extends Nugget implements ITest {
    protected status!: Status
    public result!: ITestResult

    constructor (result: ITestResult) {
        super()
        this.build(result, false)
    }

    /**
     * Prepare this test for persistence.
     *
     * @param status Which status to recursively set. False will persist current status.
     */
    public persist (status: Status | false = 'idle'): ITestResult {
        return this.defaults(this.result, status)
    }

    /**
     * Reset this test's result (i.e. remove feedback etc, as if the
     * test never ran, but persist its identifying data).
     */
    public resetResult (): void {
        this.result = this.defaults(this.result)
    }

    /**
     * Build this test from a result object.
     *
     * @param result The result object with which to build this test.
     * @param cleanup Whether to clean obsolete children after building.
     */
    protected build (result: ITestResult, cleanup: boolean): void {
        // We allow result status to be empty from reporters, but we'll
        // amend them before building the actual test.
        result.status = this.getRecursiveStatus(result)
        this.result = this.mergeResults(result)
        this.updateStatus(result.status || 'idle')
        if (result.tests && result.tests.length) {
            this.debriefTests(result.tests, cleanup)
        }
    }

    /**
     * Merge new tests results with existing ones. Useful for persisting
     * some properties which are inherent to a test (e.g. first seen date).
     *
     * @param result The result object with which to build this test.
     */
    protected mergeResults (result: ITestResult): ITestResult {
        // If result already has the "first seen" property, it's likely the test
        // being persisted from store, in which case we'll let that date prevail.
        if (get(result, 'stats.first')) {
            return result
        }
        // Otherwise, set the "first seen" date according to current existing
        // result or the current date and time (i.e. it's a new test).
        result.stats = {
            ...(result.stats || {}),
            ...{
                first: get(this.result || {}, 'stats.first', new Date().toISOString())
            }
        }

        return result
    }

    /**
     * Instantiate a new test.
     *
     * @param result The test result with which to instantiate a new test.
     */
    protected newTest (result: ITestResult): ITest {
        return new Test(result)
    }

    /**
     * Get this test's id.
     */
    public getId (): string {
        return this.result.id!
    }

    /**
     * Get this test's display name.
     */
    public getName (): string {
        return this.result.name
    }

    /**
     * Get this test's display name.
     */
    public getDisplayName (): string {
        return this.result.displayName || this.getName()
    }

    /**
     * Get this nugget's console output.
     */
    public getConsole (): Array<any> {
        return this.result.console || []
    }

    /**
     * Debrief this test.
     *
     * @param result The result object with which to debrief this test.
     * @param cleanup Whether to clean obsolete children after debriefing.
     */
    public debrief (result: ITestResult, cleanup: boolean): Promise<void> {
        // Amend result stats with last run date and time (i.e. now)
        result.stats = { ...(result.stats || {}), ...{ last: new Date().toISOString() }}
        return new Promise((resolve, reject) => {
            this.build(result, cleanup)
            this.emit('debriefed')
            resolve()
        })
    }
}
