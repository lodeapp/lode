export default {
    data () {
        return {
            show: false
        }
    },
    computed: {
        status () {
            return this.model.status
        },
        selectStatus () {
            return this.model.selected ? 'selected' : 'unselected'
        },
        expandStatus () {
            return this.show ? 'expanded' : 'collapsed'
        },
        groupClasses () {
            return [
                `status--${this.status}`,
                `is-${this.selectStatus}`,
                `is-${this.expandStatus}`
            ]
        },
        hasChildren () {
            // Assume a group always has children.
            // Override as needed.
            return true
        }
    },
    methods: {
        toggleChildren () {
            if (!this.hasChildren) {
                return
            }
            this.show = !this.show
        }
    }
}
