<template>
    <Modal>
        <template #header>
            <Icon symbol="alert" class="type--warning" />
            <h3 class="modal-title">Wrong architecture?</h3>
        </template>
        <div>
            <p>You are running Lode in an architecture that might not be appropriate to your system, which can cause it to be signifcantly slower. Please visit <a @click="$root.openExternal('https://lode.run')">lode.run</a> to check whether a more appropriate version is available.</p>
            <label class="text-normal">
                <input type="checkbox" v-model="disableConfirm">
                Do not show this message again
            </label>
        </div>
        <template #footer>
            <div class="modal-footer tertiary separated">
                <button type="button" class="btn btn-sm btn-primary" @click="switchProject">
                    Continue
                </button>
            </div>
        </template>
    </Modal>
</template>

<script>
import Confirm from '@/components/modals/mixins/confirm'

export default {
    name: 'ConfirmSwitchProject',
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
