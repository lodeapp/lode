export default {
    data () {
        return {
            hasContext: false,
            childHasContext: false
        }
    },
    methods: {
        onAddContext () {
            this.hasContext = true
            this.$emit('add-context')
        },
        onRemoveContext () {
            this.hasContext = false
            this.$emit('remove-context')
        },
        onChildAddContext () {
            this.childHasContext = true
            this.$emit('add-context')
        },
        onChildRemoveContext () {
            this.childHasContext = false
            this.$emit('remove-context')
        }
    }
}
