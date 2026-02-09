<script>
import Confirm from '@/components/modals/mixins/confirm'

export default {
    name: 'ConfirmSwitchProject',
    mixins: [Confirm],
    data() {
        return {
            disableConfirm: false,
        }
    },
    methods: {
        switchProject() {
            this.confirm(this.disableConfirm)
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
                Confirm Switch Project
            </h3>
        </template>
        <div>
            <p>Are you sure you want to switch projects? Tests in the current project will be stopped and results will be reset.</p>
            <label class="text-normal">
                <input v-model="disableConfirm" type="checkbox">
                Do not show this message again
            </label>
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
                    <button type="button" class="btn btn-sm btn-primary" @click="switchProject">
                        Switch Project
                    </button>
                </div>
            </div>
        </template>
    </Modal>
</template>
