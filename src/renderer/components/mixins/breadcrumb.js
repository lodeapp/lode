export default {
    data () {
        return {
            isChildActive: false
        }
    },
    methods: {
        onChildActivation () {
            this.isChildActive = true
            this.$root.breadcrumb(this.model)
            this.$emit('activate')
        },
        onChildDeactivation () {
            this.isChildActive = false
            this.$emit('deactivate')
        }
    }
}
