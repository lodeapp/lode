export default {
    computed: {
        identifier () {
            return this.model.id || this.model.file
        },
        status () {
            return this.$store.getters['status/status'](this.identifier)
        }
    }
}
