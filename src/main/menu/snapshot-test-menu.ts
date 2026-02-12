import type { ISuite } from '@lib/frameworks/suite'
import type { ITest } from '@lib/frameworks/test'
import { File } from '@main/file'
import { Menu } from '@main/menu'
import { clipboard } from 'electron'

/**
 * A minimal context menu for tests in snapshot mode.
 * Only includes read-only operations (copy name, reveal suite in finder).
 */
export class SnapshotTestMenu extends Menu {
    constructor(suite: ISuite, test: ITest, webContents: Electron.WebContents) {
        super(webContents)

        const filePath = suite.getFilePath()
        this
            .add({
                label: __DARWIN__
                    ? 'Copy Test Name'
                    : 'Copy test name',
                click: () => {
                    clipboard.writeText(test.getDisplayName() || test.getName())
                },
            })
            .addIf(test.getName() !== test.getDisplayName(), {
                label: __DARWIN__
                    ? 'Copy Original Test Name'
                    : 'Copy original test name',
                click: () => {
                    clipboard.writeText(test.getName())
                },
            })
            .separator()
            .add({
                label: __DARWIN__
                    ? 'Reveal Suite in Finder'
                    : __WIN32__
                        ? 'Show suite in Explorer'
                        : 'Show suite in your File Manager',
                click: () => {
                    File.reveal(filePath)
                },
                enabled: File.exists(filePath),
            })
    }
}
