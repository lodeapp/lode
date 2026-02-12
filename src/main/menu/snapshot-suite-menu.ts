import type { ISuite } from '@lib/frameworks/suite'
import { File } from '@main/file'
import { Menu } from '@main/menu'
import { clipboard } from 'electron'

/**
 * A minimal context menu for suites in snapshot mode.
 * Only includes read-only operations (copy paths, reveal in finder).
 */
export class SnapshotSuiteMenu extends Menu {
    constructor(suite: ISuite, webContents: Electron.WebContents) {
        super(webContents)

        const filePath = suite.getFilePath()
        const relativePath = suite.getFilePathRelativeToBase()
        this
            .add({
                label: __DARWIN__
                    ? 'Copy File Path'
                    : 'Copy file path',
                click: () => {
                    clipboard.writeText(filePath)
                },
            })
            .add({
                label: __DARWIN__
                    ? 'Copy Relative File Path'
                    : 'Copy relative file path',
                click: () => {
                    clipboard.writeText(relativePath)
                },
            })
            .separator()
            .add({
                label: __DARWIN__
                    ? 'Reveal in Finder'
                    : __WIN32__
                        ? 'Show in Explorer'
                        : 'Show in your File Manager',
                click: () => {
                    File.reveal(filePath)
                },
                enabled: File.exists(filePath),
            })
    }
}
