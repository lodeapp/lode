<template>
    <Modal>
        <template #header>
            <Icon symbol="stop" class="type--error" />
            <h3 class="modal-title">Reset Settings</h3>
        </template>
        <div>
            <p>Are you sure you want to erase your saved settings? You will have to add all projects and repositories again.</p>
            <p><strong>This cannot be undone.</strong></p>
        </div>
        <template #footer>
            <div class="modal-footer tertiary separated">
                <button type="button" class="btn btn-sm" @click="cancel">
                    Cancel
                </button>
                <button type="button" class="btn btn-sm btn-danger" @click="confirm">
                    Reset
                </button>
            </div>
        </template>
    </Modal>
</template>

<script>
import Confirm from '@/components/modals/mixins/confirm'

export default {
    name: 'ResetSettings',
    mixins: [Confirm]
}
</script>
