import { omit } from 'lodash'
import { Status } from '@main/lib/frameworks/status'
import { Nugget } from '@main/lib/frameworks/nugget'

export interface ITest extends Nugget {
    result?: ITestResult
    selected: boolean
    isActive: boolean

    getId (): string
    getStatus (): Status
    getName (): string
    getDisplayName (): string
    getConsole (): Array<any>
    toggleSelected (toggle?: boolean, cascade?: boolean): void
    activate (): void
    deactivate (): void
    persist (): ITestResult
    resetResult (): void
    idle (selective: boolean): void
    queue (selective: boolean): void
    error (selective: boolean): void
    idleQueued (): void
    debrief (result: ITestResult, cleanup: boolean): Promise<void>
    contextMenu (): Array<Electron.MenuItemConstructorOptions>
}

export interface ITestResult {
    identifier: string
    name: string
    displayName: string
    status: Status
    feedback?: string | object
    console?: Array<any>
    stats?: object
    isLast?: boolean
    tests?: Array<ITestResult>
    version?: string
}

export class Test extends Nugget implements ITest {
    protected status!: Status
    public result!: ITestResult
    public isActive: boolean = false

    constructor (result: ITestResult) {
        super()
        this.build(result, false)
    }

    /**
     * Prepare a given test result for persistence.
     *
     * @param result The result object that will be persisted.
     */
    public static defaults (result: ITestResult): ITestResult {
        return {
            identifier: result.identifier,
            name: result.name,
            displayName: result.displayName || result.name,
            status: 'idle'
        }
    }

    /**
     * Prepare this test for persistence.
     */
    public persist (): ITestResult {
        return {
            ...Test.defaults(this.result),
            ...{ tests: (this.result.tests || []).map((test: ITestResult) => Test.defaults(test)) }
        }
    }

    /**
     * Reset this test's result (i.e. remove feedback etc, as if the
     * test never ran, but persist its identifying data).
     */
    public resetResult (): void {
        this.result = Test.defaults(this.result)
    }

    /**
     * Build this test from a result object.
     *
     * @param result The result object with which to build this test.
     * @param cleanup Whether to clean obsolete children after building.
     */
    protected build (result: ITestResult, cleanup: boolean): void {
        this.updateStatus(result.status || 'idle')
        this.result = omit(result, 'tests')
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
        return this.result.identifier!
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
     * Activate this test (i.e. reveal details in test pane).
     */
    public activate (): void {
        this.isActive = true
    }

    /**
     * Deactivate this test.
     */
    public deactivate (): void {
        this.isActive = false
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
