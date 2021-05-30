<template>
    <Modal>
        <template #header>
            <Icon symbol="stop" class="type--error" />
            <h3 class="modal-title">Remove Project</h3>
        </template>
        <div>
            <p v-markdown.set="$root.project.name">{{ `Are you sure you want to remove project **:0** from Lode? This cannot be undone.` }}</p>
        </div>
        <template #footer>
            <div class="modal-footer tertiary separated">
                <button type="button" class="btn btn-sm autofocus" @click="cancel">
                    Cancel
                </button>
                <button type="button" class="btn btn-sm btn-danger" @click="confirm">
                    Remove
                </button>
            </div>
        </template>
    </Modal>
</template>

<script>
import Confirm from '@/components/modals/mixins/confirm'

export default {
    name: 'RemoveProject',
    mixins: [Confirm]
}
</script>
