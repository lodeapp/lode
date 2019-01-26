<template>
    <Modal>
        <template slot="header">
            <Icon symbol="alert" class="type--warning" />
            <h3 class="modal-title">Confirm Switch Project</h3>
        </template>
        <div>
            <p>{{ `Are you sure you want to switch projects? Tests in the current project will be stopped and results will be reset.` }}</p>
            <label class="text-normal">
                <input type="checkbox" v-model="disableConfirm">
                Do not show this message again
            </label>
        </div>
        <div slot="footer" class="modal-footer tertiary separated">
            <button type="button" class="btn btn-sm autofocus" @click="cancel">
                Cancel
            </button>
            <button type="button" class="btn btn-sm btn-primary" @click="switchProject">
                Switch Project
            </button>
        </div>
    </Modal>
</template>

<script>
import Modal from '@/components/modals/Modal'
import Confirm from '@/components/modals/mixins/confirm'

export default {
    name: 'ConfirmSwitchProject',
    components: {
        Modal
    },
    mixins: [Confirm],
    data () {
        return {
            disableConfirm: false
        }
    },
    methods: {
        switchProject () {
            this.confirm(this.disableConfirm)
        }
    }
}
</script>
