import { ISuiteResult, Suite } from '@main/lib/frameworks/suite'

export class PHPUnitSuite extends Suite {
    public canToggleTests: boolean = true
    public class?: string

    /**
     * Build this suite from a result object.
     *
     * @param result The result object with which to build this suite.
     */
    protected build (result: ISuiteResult): void {
        super.build(result)
        this.class = this.getMeta('class', '')
    }

    /**
     * Escape this suite's class name for using as a command argument.
     *
     * @param className The class name to escape.
     */
    public static escapeClassName (className: string): string {
        return className.replace(/\\/g, '\\\\')
    }
}
