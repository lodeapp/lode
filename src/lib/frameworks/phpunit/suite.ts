import { clipboard } from 'electron'
import { ISuiteResult, Suite } from '@lib/frameworks/suite'

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

    /**
     * Append items to a PHPUnit suite's context menu.
     */
    public contextMenu (): Array<Electron.MenuItemConstructorOptions> {
        return [{
            label: __DARWIN__
                ? 'Copy Class Name'
                : 'Copy class name',
            click: () => {
                clipboard.writeText(this.class || '')
            },
            enabled: !!this.class,
            before: ['copy-local']
        }]
    }
}
