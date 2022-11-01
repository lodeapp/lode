import Modal from '@/components/modals/Modal.vue'

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
