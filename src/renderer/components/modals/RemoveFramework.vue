<template>
    <Modal>
        <template #header>
            <Icon symbol="stop" class="type--error" />
            <h3 class="modal-title">Remove Framework</h3>
        </template>
        <div>
            <p v-markdown.set="framework.name">{{ 'Are you sure you want to remove **:0** from this project? This will not delete any tests from your filesystem and cannot be undone.' }}</p>
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
    name: 'RemoveFramework',
    mixins: [Confirm],
    props: {
        framework: {
            type: Object,
            required: true
        }
    }
}
</script>
