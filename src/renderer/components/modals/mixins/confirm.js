export default {
    props: {
        resolve: {
            type: Function,
            required: true
        },
        reject: {
            type: Function,
            required: true
        }
    },
    methods: {
        confirm (data) {
            this.resolve(data)
            this.$emit('hide')
        },
        cancel () {
            this.reject()
            this.$emit('hide')
        }
    }
}
