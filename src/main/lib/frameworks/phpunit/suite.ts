import { get } from 'lodash'
import { ISuiteResult, Suite } from '@lib/frameworks/suite'

export class PHPUnitSuite extends Suite {
    public canToggleTests: boolean = true
    public class?: string

    build (result: ISuiteResult): void {
        super.build(result)
        this.class = get(result, 'meta.class')
    }

    static escapeClassName (className: string): string {
        return className.replace(/\\/g, '\\\\')
    }
}
