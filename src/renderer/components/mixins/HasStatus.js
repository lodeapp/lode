export default {
    data () {
        return {
            status: this.model.status || 'idle'
        }
    },
    computed: {
        identifier () {
            return this.model.id || this.model.file
        }
    },
    created () {
        // @TODO: check frameworks being instantiated twice when switching in sidebar
        // console.log('created')
        Lode.ipc.on(`${this.identifier}:status`, this.statusListener)
    },
    destroyed () {
        Lode.ipc.removeAllListeners(`${this.identifier}:status`)
    },
    methods: {
        statusListener (event, payload) {
            this.$payload(payload, (to, from) => {
                this.status = to
                this.$emit('status', to, from, this.model)
            })
        }
    }
}
