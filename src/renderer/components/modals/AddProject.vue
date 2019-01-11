<template>
    <Modal
        :dismissable="false"
        title="Add project"
        help="Projects allow you to group different repositories and run their tests all at once. After adding a project you'll be prompted to add repositories. You can have as many projects as you want."
    >
        <form @submit="handleSubmit">
            <dl class="form-group">
                <dt><label for="project-name">Project name</label></dt>
                <dd>
                    <input
                        type="text"
                        id="project-name"
                        class="form-control input-block input-sm"
                        v-model="project"
                        placeholder="Project name"
                    >
                </dd>
            </dl>
        </form>
        <div slot="footer" class="modal-footer tertiary separated">
            <button type="button" class="btn btn-sm" @click="cancel">
                Cancel
            </button>
            <button type="submit" class="btn btn-sm btn-primary" :disabled="!project" @click="add">
                Add project
            </button>
        </div>
    </Modal>
</template>

<script>
import { mapActions } from 'vuex'
import { Project } from '@lib/frameworks/project'
import Modal from '@/components/modals/Modal'
import Confirm from '@/components/modals/mixins/confirm'

export default {
    name: 'AddProject',
    components: {
        Modal
    },
    mixins: [Confirm],
    data () {
        return {
            project: ''
        }
    },
    methods: {
        handleSubmit () {
            if (!this.project) {
                return
            }
            this.add()
        },
        add () {
            this.addProject(new Project({ name: this.project }))
            this.confirm()
        },
        ...mapActions({
            addProject: 'config/addProject'
        })
    }
}
</script>
