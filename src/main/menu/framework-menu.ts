import { Menu } from './menu'
import { IRepository } from '@lib/frameworks/repository'
import { IFramework } from '@lib/frameworks/framework'

export class FrameworkMenu extends Menu {

    constructor (repository: IRepository, framework: IFramework, webContents: Electron.WebContents) {
        super(webContents)

        this
            .add({
                label: framework.getDisplayName(),
                enabled: false
            })
            .add({
                label: __DARWIN__ ? 'Refresh Framework' : 'Refresh framework',
                click: () => {
                    framework.refresh()
                },
                accelerator: 'CmdOrCtrl+Shift+R'
            })
            .add({
                label: __DARWIN__ ? 'Run Framework' : 'Run framework',
                click: () => {
                    framework.start()
                },
                accelerator: 'CmdOrCtrl+R'
            })
            .add({
                label: __DARWIN__ ? 'Stop Framework' : 'Stop framework',
                click: () => {
                    framework.stop()
                },
                accelerator: 'CmdOrCtrl+Esc'
            })
            .separator()
            .add({
                label: __DARWIN__ ? 'Filter Items' : 'Filter items',
                click: () => {
                    this.emit('filter')
                },
                accelerator: 'CmdOrCtrl+F'
            })
            .separator()
            .add({
                label: __DARWIN__ ? 'Framework Settings…' : 'Framework settings…',
                click: () => {
                    this.emit('repository-manage', {
                        repository: repository.render(),
                        framework: framework.render()
                    })
                }
            })
            .separator()
            .add({
                label: 'Remove',
                click: () => {
                    this.emit('remove-framework', framework.render())
                },
                accelerator: 'CmdOrCtrl+Backspace'
            })
    }
}

