import { mapActions } from 'vuex'

export default {
    data () {
        return {
            isChildActive: false
        }
    },
    methods: {
        onChildActivation () {
            this.isChildActive = true
            this.breadcrumb(this.model)
            this.$emit('activate')
        },
        onChildDeactivation () {
            this.isChildActive = false
            this.$emit('deactivate')
        },
        ...mapActions({
            breadcrumb: 'tests/breadcrumb'
        })
    }
}
