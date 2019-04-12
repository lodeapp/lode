import { Menu } from '@main/menu'

export default {
    data () {
        return {
            selectedFramework: this.initial,
            menuActive: false,
            menu: new Menu()
                .add({
                    label: this.repository.name,
                    enabled: false
                })
                .add({
                    label: 'Manage frameworks…',
                    click: () => {
                        this.manage()
                    }
                })
                .add({
                    label: 'Scan for frameworks…',
                    click: () => {
                        this.scan()
                    }
                })
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
        }
    },
    methods: {
        openMenu (event) {
            this.menu
                .attachTo(this.$el.querySelector('.more-actions'))
                .open()
        },
        scan () {
            this.repository.scan()
                .then(pending => {
                    this.$modal.open('ManageFrameworks', {
                        repository: this.repository,
                        scanned: true,
                        pending
                    })
                })
        },
        manage () {
            this.$modal.open('ManageFrameworks', {
                repository: this.repository,
                scanned: false
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
