import { Menu } from './menu'
import { IProject } from '@lib/frameworks/project'

export class ProjectMenu extends Menu {

    constructor (project: IProject, webContents: Electron.WebContents) {
        super(webContents)

        this
            .add({
                label: __DARWIN__ ? 'Refresh All' : 'Refresh all',
                accelerator: 'CmdOrCtrl+Alt+Shift+R',
                click: () => {
                    project.refresh()
                }
            })
            .add({
                label: __DARWIN__ ? 'Run All' : 'Run all',
                accelerator: 'CmdOrCtrl+Alt+R',
                click: () => {
                    project.start()
                }
            })
            .add({
                label: __DARWIN__ ? 'Stop All' : 'Stop all',
                accelerator: 'Alt+Esc',
                click: () => {
                    project.stop()
                }
            })
            .separator()
            .add({
                label: __DARWIN__ ? 'Rename Project' : 'Rename project',
                accelerator: 'CmdOrCtrl+Alt+E',
                click: () => {
                    this.emit('rename-project')
                }
            })
            .add({
                label: __DARWIN__ ? 'Remove Project' : 'Remove project',
                accelerator: 'CmdOrCtrl+Alt+Backspace',
                click: () => {
                    this.emit('remove-project')
                }
            })
            .separator()
            .add({
                label: __DARWIN__ ? 'Add Repositories… ' : 'Add repositories…',
                accelerator: 'CmdOrCtrl+Alt+O',
                click: () => {
                    this.emit('add-repositories')
                }
            })
    }
}
