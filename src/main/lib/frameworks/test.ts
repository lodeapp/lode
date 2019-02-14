import { omit } from 'lodash'
import { v4 as uuid } from 'uuid'
import { Status } from '@main/lib/frameworks/status'
import { Nugget } from '@main/lib/frameworks/nugget'

export interface ITest extends Nugget {
    readonly id: string
    readonly identifier: string
    result?: ITestResult
    selected: boolean

    getStatus (): Status
    getName (): string
    getDisplayName (): string
    toggleSelected (toggle?: boolean, cascade?: boolean): void
    debrief (result: ITestResult, selective: boolean): Promise<void>
    reset (selective: boolean): void
    resetResult (): void
    queue (selective: boolean): void
    resetQueued (): void
    debrief (result: ITestResult, cleanup: boolean): Promise<void>
    persist (): ITestResult
}

export interface ITestResult {
    identifier: string
    name: string
    displayName: string
    status: Status
    feedback?: string | object
    stats?: object
    isLast?: boolean
    tests?: Array<ITestResult>
    version?: string
}

export class Test extends Nugget implements ITest {
    protected status!: Status
    public readonly id: string
    public readonly identifier: string
    public result!: ITestResult

    constructor (result: ITestResult) {
        super()
        this.id = uuid()
        this.identifier = result.identifier
        this.build(result, false)
    }

    /**
     * Prepares the test for persistence.
     */
    public persist (): ITestResult {
        return {
            identifier: this.result.identifier,
            name: this.getName(),
            displayName: this.getDisplayName(),
            status: 'idle',
            tests: this.tests.map((test: ITest) => test.persist())
        }
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
     * Reset this test's result
     */
    public resetResult (): void {
        this.result = {
            identifier: this.result.identifier,
            name: this.getName(),
            displayName: this.getDisplayName(),
            status: this.status
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
     * Get the framework version from this test, if any.
     */
    public getVersion (): string | undefined {
        return this.result.version
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
