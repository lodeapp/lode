export default {
    data () {
        return {
            menuActive: false
        }
    },
    methods: {
        onContextMenu () {
            let rect
            if (this.$el.querySelector('.more-actions')) {
                rect = JSON.parse(JSON.stringify(this.$el.querySelector('.more-actions').getBoundingClientRect()))
            }
            this.menuActive = true
            Lode.ipc.invoke('framework-context-menu', this.model.id, rect)
                .finally(() => {
                    this.menuActive = false
                    const button = this.$el.querySelector('.more-actions')
                    if (button) {
                        button.blur()
                    }
                })
        }
    }
}
