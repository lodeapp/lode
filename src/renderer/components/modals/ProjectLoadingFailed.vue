<template>
    <Modal help="You might wish to keep the project and try again, or reset all settings.">
        <template #header>
            <Icon symbol="stop" class="type--error" />
            <h3 class="modal-title">Project Failed to Load</h3>
        </template>
        <div>
            <p>The data for the project might've been deleted or corrupted, and will need to be removed.</p>
        </div>
        <template #footer>
            <div class="modal-footer tertiary separated">
                <button type="button" class="btn btn-sm autofocus" @click="cancel">
                    Keep project
                </button>
                <button type="button" class="btn btn-sm btn-danger" @click="confirm">
                    Remove project
                </button>
            </div>
        </template>
    </Modal>
</template>

<script>
import Confirm from '@/components/modals/mixins/confirm'

export default {
    name: 'ProjectLoadingFailed',
    mixins: [Confirm]
}
</script>
