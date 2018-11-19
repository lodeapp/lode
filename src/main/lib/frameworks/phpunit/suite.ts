import { get } from 'lodash'
import { ISuiteResult, Suite } from '@lib/frameworks/suite'

export class PHPUnitSuite extends Suite {
    public canToggleTests: boolean = true
    public class?: string

    /**
     * Build this suite from a result object.
     *
     * @param result The result object with which to build this suite.
     */
    build (result: ISuiteResult): void {
        super.build(result)
        this.class = get(result, 'meta.class')
    }

    /**
     * Escape this suite's class name for using as a command argument.
     *
     * @param className The class name to escape.
     */
    static escapeClassName (className: string): string {
        return className.replace(/\\/g, '\\\\')
    }
}
