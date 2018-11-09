<template>
    <Modal title="Error" type="error" :dismissable="false">
        <p v-markdown.set="framework.name">An error occurred while executing **:0**.</p>
        <pre>{{ message }}</pre>
        <div slot="footer" class="modal-footer tertiary">
            <button type="button" class="btn btn-sm btn-primary" @click="confirm">
                Close
            </button>
        </div>
    </Modal>
</template>

<script>
import confirm from './mixins/confirm'
import Modal from '@/components/modals/Modal'

export default {
    name: 'ConfirmLeave',
    components: {
        Modal
    },
    mixins: [
        confirm
    ],
    props: {
        framework: {
            type: Object,
            required: true
        },
        message: {
            type: [String, Error],
            default: ''
        }
    }
}
</script>
