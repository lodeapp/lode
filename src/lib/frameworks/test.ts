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
    idleQueued (): void
    debrief (result: ITestResult, cleanup: boolean): Promise<void>
    hasChildren(): boolean
    contextMenu (): Array<Electron.MenuItemConstructorOptions>
}

export interface ITestResult {
    id: string
    name: string
    displayName: string
    status: Status
    feedback?: string | object
    console?: Array<any>
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
        this.updateStatus(result.status || 'idle')
        this.result = result
        if (result.tests && result.tests.length) {
            this.debriefTests(result.tests, cleanup)
        }
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
    getId (): string {
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
        return this.result.console!
    }

    /**
     * Debrief this test.
     *
     * @param result The result object with which to debrief this test.
     * @param cleanup Whether to clean obsolete children after debriefing.
     */
    public debrief (result: ITestResult, cleanup: boolean): Promise<void> {
        return new Promise((resolve, reject) => {
            this.build(result, cleanup)
            this.emit('debriefed')
            resolve()
        })
    }
}
