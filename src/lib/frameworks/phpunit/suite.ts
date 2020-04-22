import { clipboard } from 'electron'
import { Suite } from '@lib/frameworks/suite'

export class PHPUnitSuite extends Suite {
    /**
     * Get this suite's class name.
     */
    public getClassName (): string {
        return this.getMeta('class', '').replace(/\\/g, '\\\\')
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
                clipboard.writeText(this.getClassName() || '')
            },
            enabled: !!this.getClassName(),
            before: ['copy-local']
        }]
    }
}
