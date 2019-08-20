import { Menu } from '@main/menu'

export default {
    data () {
        return {
            menuActive: false
        }
    },
    methods: {
        openMenu (event) {
            const menu = new Menu()
            menu
                .add({
                    label: __DARWIN__ ? 'Refresh All' : 'Refresh all',
                    accelerator: 'CmdOrCtrl+Alt+Shift+R',
                    click: () => {
                        this.$root.project.refresh()
                    }
                })
                .add({
                    label: __DARWIN__ ? 'Run All' : 'Run all',
                    accelerator: 'CmdOrCtrl+Alt+R',
                    click: () => {
                        this.$root.project.start()
                    }
                })
                .add({
                    label: __DARWIN__ ? 'Stop All' : 'Stop all',
                    accelerator: 'CmdOrCtrl+Alt+Esc',
                    click: () => {
                        this.$root.project.stop()
                    }
                })
                .separator()
                .add({
                    label: __DARWIN__ ? 'Rename Project' : 'Rename project',
                    accelerator: 'CmdOrCtrl+Alt+E',
                    click: () => {
                        this.$root.editProject()
                    }
                })
                .add({
                    label: __DARWIN__ ? 'Remove Project' : 'Remove project',
                    accelerator: 'CmdOrCtrl+Alt+Backspace',
                    click: () => {
                        this.$root.removeProject()
                    }
                })
                .separator()
                .add({
                    label: __DARWIN__ ? 'Add Repositories… ' : 'Add repositories…',
                    accelerator: 'CmdOrCtrl+Alt+O',
                    click: () => {
                        this.$root.addRepositories()
                    }
                })
                .before(() => {
                    this.menuActive = true
                })
                .after(() => {
                    this.menuActive = false
                })
                .open()
        }
    }
}
