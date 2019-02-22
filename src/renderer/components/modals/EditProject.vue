<template>
    <Modal
        :title="project ? 'Edit project' : 'Add project'"
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
                {{ project ? 'Save changes' : 'Add project' }}
            </button>
        </div>
    </Modal>
</template>

<script>
import { state } from '@main/lib/state'
import Modal from '@/components/modals/Modal'
import Confirm from '@/components/modals/mixins/confirm'

export default {
    name: 'EditProject',
    components: {
        Modal
    },
    mixins: [Confirm],
    props: {
        project: {
            type: Object,
            default: null
        }
    },
    data () {
        return {
            name: this.project ? this.project.name : ''
        }
    },
    computed: {
        hasProjects () {
            return state.hasProjects()
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
            this.confirm({ name: this.name })
        }
    }
}
</script>
