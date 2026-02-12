<script>
import Confirm from '@/components/modals/mixins/confirm'

export default {
    name: 'ConfirmOpenSnapshot',
    mixins: [Confirm],
    methods: {
        openHere() {
            this.confirm(true)
        },
        openInNewWindow() {
            this.confirm('new-window')
        },
    },
}
</script>

<template>
    <Modal>
        <template #header>
            <Icon symbol="alert" class="type--warning" />
            <h3 class="modal-title">
                Open File
            </h3>
        </template>
        <div>
            <p>Opening a results file will stop any running tests and replace the current view.</p>
        </div>
        <template #footer>
            <div class="modal-footer tertiary separated">
                <button type="button" class="btn btn-sm autofocus" @click="cancel">
                    Cancel
                </button>
                <div>
                    <button type="button" class="btn btn-sm" @click="openInNewWindow">
                        Open in New Window
                    </button>
                    <button type="button" class="btn btn-sm btn-primary" @click="openHere">
                        Open Here
                    </button>
                </div>
            </div>
        </template>
    </Modal>
</template>
