<template>
    <Modal :dismissable="false">
        <template slot="header">
            <Icon symbol="alert" class="type--error" />
            <h3 class="modal-title">Reset Settings</h3>
        </template>
        <div>
            <p>Are you sure you want to erase your saved settings? You will have to add all projects and repositories again.</p>
            <p><strong>This cannot be undone.</strong></p>
        </div>
        <div slot="footer" class="modal-footer tertiary separated">
            <button type="button" class="btn btn-sm" @click="cancel">
                Cancel
            </button>
            <button type="button" class="btn btn-sm btn-danger" @click="confirm">
                Reset
            </button>
        </div>
    </Modal>
</template>

<script>
import Modal from '@/components/modals/Modal'
import Confirm from '@/components/modals/mixins/confirm'

export default {
    name: 'ResetSettings',
    components: {
        Modal
    },
    mixins: [Confirm]
}
</script>
