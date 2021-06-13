import { Menu } from '@main/menu'
import { File } from '@main/file'
import { clipboard } from 'electron'

export class FileMenu extends Menu {
    constructor (filePath: string, webContents: Electron.WebContents) {
        super(webContents)

        this
            .add({
                id: 'reveal',
                label: __DARWIN__
                    ? 'Reveal in Finder'
                    : __WIN32__
                        ? 'Show in Explorer'
                        : 'Show in your File Manager',
                click: () => {
                    File.reveal(filePath)
                },
                enabled: File.exists(filePath)
            })
            .add({
                id: 'copy',
                label: __DARWIN__
                    ? 'Copy File Path'
                    : 'Copy file path',
                click: () => {
                    clipboard.writeText(filePath)
                },
                enabled: File.exists(filePath)
            })
            .add({
                id: 'open',
                label: __DARWIN__
                    ? 'Open with Default Program'
                    : 'Open with default program',
                click: () => {
                    File.open(filePath)
                },
                enabled: File.isSafe(filePath) && File.exists(filePath)
            })
    }
}
