<script>
import Confirm from '@/components/modals/mixins/confirm'

export default {
    name: 'RenameRepository',
    mixins: [Confirm],
    props: {
        repository: {
            type: Object,
            required: true,
        },
    },
    data() {
        return {
            name: this.repository.name,
        }
    },
    methods: {
        handleSubmit() {
            if (!this.name) {
                return
            }
            this.confirm(this.name)
        },
    },
}
</script>

<template>
    <Modal title="Rename repository">
        <form @submit.prevent="handleSubmit">
            <dl class="form-group">
                <dt><label for="repository-name">Repository name</label></dt>
                <dd>
                    <input
                        id="repository-name"
                        v-model="name"
                        type="text"
                        class="form-control input-block input-sm"
                        placeholder="Repository name"
                    >
                </dd>
            </dl>
        </form>
        <template #footer>
            <div class="modal-footer tertiary separated">
                <button type="button" class="btn btn-sm" @click="cancel">
                    Cancel
                </button>
                <button type="button" class="btn btn-sm btn-primary" :disabled="!name" @click="handleSubmit">
                    Rename
                </button>
            </div>
        </template>
    </Modal>
</template>
