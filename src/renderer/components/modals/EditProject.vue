<template>
    <Modal
        :title="add ? 'Add project' : 'Edit project'"
        :help="!hasProjects ? `Projects allow you to group different repositories and run their tests all at once. After adding a project you'll be prompted to add repositories. You can have as many projects as you want.` : ''"
    >
        <form @submit.prevent="handleSubmit">
            <dl class="form-group">
                <dt><label for="project-name">Project name</label></dt>
                <dd>
                    <input
                        type="text"
                        id="project-name"
                        class="form-control input-block input-sm"
                        v-model="name"
                        placeholder="Project name"
                    >
                </dd>
            </dl>
        </form>
        <div slot="footer" class="modal-footer tertiary separated">
            <button type="button" class="btn btn-sm" @click="cancel">
                Cancel
            </button>
            <button type="button" class="btn btn-sm btn-primary" :disabled="!name" @click="submit">
                {{ add ? 'Add project' : 'Save changes' }}
            </button>
        </div>
    </Modal>
</template>

<script>
import Modal from '@/components/modals/Modal'
import Confirm from '@/components/modals/mixins/confirm'

export default {
    name: 'EditProject',
    components: {
        Modal
    },
    mixins: [Confirm],
    props: {
        add: {
            type: Boolean,
            default: null
        }
    },
    data () {
        return {
            name: this.add ? '' : this.$root.project.name
        }
    },
    computed: {
        hasProjects () {
            return (this.$root.setting('projects') || []).length
        }
    },
    methods: {
        handleSubmit (event) {
            if (!this.name) {
                return
            }
            this.submit()
        },
        submit () {
            this.confirm({
                name: this.name
            })
        }
    }
}
</script>
