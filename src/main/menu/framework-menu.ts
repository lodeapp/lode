import { Menu } from '@main/menu'
import { IRepository } from '@lib/frameworks/repository'
import { IFramework } from '@lib/frameworks/framework'

export class FrameworkMenu extends Menu {
    constructor (
        repository: IRepository | null,
        framework: IFramework | null,
        webContents: Electron.WebContents
    ) {
        super(webContents)

        this
            .addIf(!!framework, {
                label: framework ? framework!.getDisplayName() : '',
                enabled: false
            })
            .add({
                label: __DARWIN__ ? 'Refresh Framework' : 'Refresh framework',
                click: () => {
                    framework!.refresh()
                },
                accelerator: 'CmdOrCtrl+Shift+R',
                enabled: !!framework
            })
            .add({
                label: __DARWIN__ ? 'Run Framework' : 'Run framework',
                click: () => {
                    framework!.start()
                },
                accelerator: 'CmdOrCtrl+R',
                enabled: !!framework
            })
            .add({
                label: __DARWIN__ ? 'Stop Framework' : 'Stop framework',
                click: () => {
                    framework!.stop()
                },
                accelerator: 'CmdOrCtrl+Esc',
                enabled: !!framework
            })
            .separator()
            .add({
                label: __DARWIN__ ? 'Filter Items' : 'Filter items',
                click: () => {
                    this.emit('filter')
                },
                accelerator: 'CmdOrCtrl+F',
                enabled: !!framework
            })
            .separator()
            .add({
                label: __DARWIN__ ? 'Framework Settings…' : 'Framework settings…',
                click: () => {
                    this.emit('repository-manage', {
                        repository: repository!.render(),
                        framework: framework!.render()
                    })
                },
                enabled: !!repository && !!framework
            })
            .separator()
            .add({
                label: 'Remove',
                click: () => {
                    this.emit('framework-remove', framework!.render())
                },
                accelerator: 'CmdOrCtrl+Backspace',
                enabled: !!framework
            })
    }
}

