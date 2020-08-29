import { Menu } from '@main/menu'

export default {
    data () {
        return {
            menuActive: false,
            menu: new Menu()
                .add({
                    // @TODO: redo display name
                    // label: this.model.getDisplayName(),
                    label: this.model.name,
                    enabled: false
                })
                .add({
                    label: __DARWIN__ ? 'Framework Settings…' : 'Framework settings…',
                    click: () => {
                        this.manage()
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
        manage () {
            this.$emit('manage', this.model)
        },
        remove () {
            this.$modal.confirm('RemoveFramework', { framework: this.model })
                .then(() => {
                    this.$emit('remove', this.model.id)
                })
                .catch(() => {})
        }
    }
}
