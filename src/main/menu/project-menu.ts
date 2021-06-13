import { Menu } from '@main/menu'
import { IProject } from '@lib/frameworks/project'

export class ProjectMenu extends Menu {
    constructor (project: IProject | null, webContents: Electron.WebContents) {
        super(webContents)

        this
            .add({
                label: __DARWIN__ ? 'Refresh All' : 'Refresh all',
                accelerator: 'CmdOrCtrl+Alt+Shift+R',
                click: () => {
                    project!.refresh()
                },
                enabled: !!project
            })
            .add({
                label: __DARWIN__ ? 'Run All' : 'Run all',
                accelerator: 'CmdOrCtrl+Alt+R',
                click: () => {
                    project!.start()
                },
                enabled: !!project
            })
            .add({
                label: __DARWIN__ ? 'Stop All' : 'Stop all',
                accelerator: 'Alt+Esc',
                click: () => {
                    project!.stop()
                },
                enabled: !!project
            })
            .separator()
            .add({
                label: __DARWIN__ ? 'Rename Project' : 'Rename project',
                accelerator: 'CmdOrCtrl+Alt+E',
                click: () => {
                    this.emit('project-edit')
                },
                enabled: !!project
            })
            .add({
                label: __DARWIN__ ? 'Remove Project' : 'Remove project',
                accelerator: 'CmdOrCtrl+Alt+Backspace',
                click: () => {
                    this.emit('project-remove')
                },
                enabled: !!project
            })
            .separator()
            .add({
                label: __DARWIN__ ? 'Add Repositories… ' : 'Add repositories…',
                accelerator: 'CmdOrCtrl+Alt+O',
                click: () => {
                    this.emit('repository-add')
                },
                enabled: !!project
            })
    }
}
