import { Suite } from '@lib/frameworks/suite'

export class PHPUnitSuite extends Suite {
    public canToggleTests: boolean = true
    public class?: string
}
