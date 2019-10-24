import { Menu } from '@main/menu'

export default {
    data () {
        return {
            selectedFramework: this.initial,
            menuActive: false
        }
    },
    computed: {
        repositoryPath () {
            return this.repository.getPath()
        }
    },
    methods: {
        openMenu (event) {
            const menu = new Menu()
            if (this.repository.exists()) {
                menu
                    .add({
                        label: this.repository.name,
                        enabled: false
                    })
                    .add({
                        label: __DARWIN__ ? 'Refresh' : 'Refresh',
                        click: () => {
                            this.refresh()
                        }
                    })
                    .add({
                        label: __DARWIN__ ? 'Run' : 'Run',
                        click: () => {
                            this.start()
                        }
                    })
                    .add({
                        label: __DARWIN__ ? 'Stop' : 'Stop',
                        click: () => {
                            this.stop()
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
                            this.$root.copyToClipboard(this.repositoryPath)
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
                            this.$root.revealFile(this.repositoryPath)
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
                            this.$emit('locate', this.repository)
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
            this.$emit('scan', this.repository)
        },
        manage () {
            this.$modal.open('ManageFrameworks', {
                repository: this.repository,
                scan: false
            })
        },
        remove () {
            this.$modal.confirm('RemoveRepository', { repository: this.repository })
                .then(() => {
                    this.$emit('remove', this.repository)
                })
                .catch(() => {})
        }
    }
}
