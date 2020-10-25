import { Menu } from './menu'
import { ISuite } from '@lib/frameworks/suite'
import { File } from '../file'
import { clipboard } from 'electron'

export class SuiteMenu extends Menu {

    constructor (suite: ISuite, webContents: Electron.WebContents) {
        super(webContents)

        const filePath = suite.getFilePath()
        const remoteFilePath = suite.file !== filePath ? suite.file : ''
        this
            .add({
                id: 'filter',
                label: __DARWIN__ ? 'Filter this Item' : 'Filter this item',
                click: () => {
                    this.emit('filter', `"${suite.getRelativePath()}"`)
                }
            })
            .add({
                id: 'filter-and-run',
                label: __DARWIN__ ? 'Filter this Item and Run' : 'Filter this item and run',
                click: () => {
                    suite.getFramework().once('filter', filters => {
                        suite.getFramework().start()
                    })
                    this.emit('filter', `"${suite.getRelativePath()}"`)
                }
            })
            .separator()
            .add({
                id: 'copy-local',
                label: __DARWIN__
                    ? remoteFilePath ? 'Copy Local File Path' : 'Copy File Path'
                    : remoteFilePath ? 'Copy local file path' : 'Copy file path',
                click: () => {
                    clipboard.writeText(filePath)
                },
                enabled: File.exists(filePath)
            })
            .addIf(!!remoteFilePath, {
                id: 'copy-remote',
                label: __DARWIN__
                    ? 'Copy Remote File Path'
                    : 'Copy Remote file path',
                click: () => {
                    clipboard.writeText(remoteFilePath)
                }
            })
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
                id: 'open',
                label: __DARWIN__
                    ? 'Open with Default Program'
                    : 'Open with default program',
                click: () => {
                    this.openFile(filePath)
                },
                enabled: suite.canBeOpened()
            })
            .addMultiple(suite.contextMenu())
            .separator()
            .add({
                label: __DARWIN__
                    ? 'Refresh Metadata'
                    : 'Refresh metadata',
                click: () => {
                    suite.resetMeta()
                    suite.getFramework().refresh()
                },
                enabled: !!suite.getMeta()
            })
    }
}
