import Modal from '@/components/modals/Modal'

export default {
    components: {
        Modal
    },
    emits: ['hide'],
    methods: {
        close () {
            this.$emit('hide')
        }
    }
}
