<template>
    <Modal>
        <template slot="header">
            <Icon symbol="stop" class="type--error" />
            <h3 class="modal-title">Remove Project</h3>
        </template>
        <div>
            <p v-markdown.set="$root.project.name">{{ `Are you sure you want to remove project **:0** from Lode? This cannot be undone.` }}</p>
        </div>
        <div slot="footer" class="modal-footer tertiary separated">
            <button type="button" class="btn btn-sm autofocus" @click="cancel">
                Cancel
            </button>
            <button type="button" class="btn btn-sm btn-danger" @click="confirm">
                Remove
            </button>
        </div>
    </Modal>
</template>

<script>
import Modal from '@/components/modals/Modal'
import Confirm from '@/components/modals/mixins/confirm'

export default {
    name: 'RemoveProject',
    components: {
        Modal
    },
    mixins: [Confirm]
}
</script>
