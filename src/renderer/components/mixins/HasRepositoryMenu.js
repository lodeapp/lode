import { ipcRenderer } from 'electron'
import { Menu } from '@main/menu'

export default {
    data () {
        return {
            selectedFramework: this.initial,
            menuActive: false
        }
    },
    methods: {
        async openMenu (event) {
            const menu = new Menu()
            const exists = await this.$root.fileExists(this.model.path)
            if (exists) {
                menu
                    .add({
                        label: this.model.name,
                        enabled: false
                    })
                    .add({
                        label: __DARWIN__ ? 'Refresh' : 'Refresh',
                        click: () => {
                            ipcRenderer.send('repository-refresh', this.model.id)
                        }
                    })
                    .add({
                        label: __DARWIN__ ? 'Run' : 'Run',
                        click: () => {
                            ipcRenderer.send('repository-start', this.model.id)
                        }
                    })
                    .add({
                        label: __DARWIN__ ? 'Stop' : 'Stop',
                        click: () => {
                            ipcRenderer.send('repository-stop', this.model.id)
                        }
                    })
                    .separator()
                    .add({
                        label: __DARWIN__ ? 'Manage Frameworks…' : 'Manage frameworks…',
                        click: () => {
                            this.manage()
                        }
                    })
                    .add({
                        label: __DARWIN__ ? 'Scan for Frameworks…' : 'Scan for frameworks…',
                        click: () => {
                            this.scan()
                        }
                    })
                    .separator()
                    .add({
                        id: 'copy',
                        label: __DARWIN__
                            ? 'Copy Repository Path'
                            : 'Copy repository path',
                        click: () => {
                            this.$root.copyToClipboard(this.model.path)
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
                            this.$root.revealFile(this.model.path)
                        }
                    })
            } else {
                menu
                    .add({
                        id: 'locate',
                        label: 'Repository missing',
                        enabled: false
                    })
                    .add({
                        id: 'locate',
                        label: __DARWIN__ ? 'Locate Repository' : 'Locate repository',
                        click: () => {
                            this.$emit('locate', this.model)
                        }
                    })
            }
            menu
                .separator()
                .add({
                    label: 'Remove',
                    click: () => {
                        this.remove()
                    }
                })
                .before(() => {
                    this.menuActive = true
                })
                .after(() => {
                    this.menuActive = false
                    const button = this.$el.querySelector('.more-actions')
                    if (button) {
                        button.blur()
                    }
                })
                .attachTo(this.$el.querySelector('.more-actions'))
                .open()
        },
        scan () {
            this.$emit('scan', this.model)
        },
        manage () {
            this.$modal.open('ManageFrameworks', {
                repository: this.model,
                scan: false
            })
        },
        remove () {
            this.$modal.confirm('RemoveRepository', { repository: this.model })
                .then(() => {
                    this.$emit('remove', this.model)
                })
                .catch(() => {})
        }
    }
}
