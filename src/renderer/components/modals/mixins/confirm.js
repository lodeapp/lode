import Modal from '@/components/modals/mixins/modal'

export default {
    mixins: [Modal],
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
            this.close()
        },
        cancel () {
            this.reject()
            this.close()
        }
    }
}
