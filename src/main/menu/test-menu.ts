import type { ISuite } from '@lib/frameworks/suite'
import type { ITest } from '@lib/frameworks/test'
import { Menu } from '@main/menu'
import { clipboard } from 'electron'

export class TestMenu extends Menu {
    constructor(suite: ISuite, test: ITest, webContents: Electron.WebContents) {
        super(webContents)

        const originalName = test.getName() !== test.getDisplayName() ? test.getName() : ''
        this
            .add({
                label: __DARWIN__
                    ? 'Copy Test Name'
                    : 'Copy test name',
                click: () => {
                    clipboard.writeText(test.getDisplayName() || test.getName())
                },
            })
            .addIf(!!originalName, {
                label: __DARWIN__
                    ? 'Copy Original Test Name'
                    : 'Copy original test name',
                click: () => {
                    clipboard.writeText(originalName)
                },
            })
            .separator()
            .add({
                label: __DARWIN__
                    ? 'Open Suite with Default Program'
                    : 'Open suite with default program',
                click: () => {
                    suite.open()
                },
                enabled: suite.canBeOpened(),
            })
    }
}
