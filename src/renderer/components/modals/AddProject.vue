<template>
    <Modal
        :dismissable="false"
        title="Add project"
        help="Projects allow you to group different repositories and run their tests all at once. After adding a project you'll be prompted to add repositories. You can have as many projects as you want."
    >
        <form>
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
            <button type="button" class="btn btn-sm" @click="$emit('hide')">
                Cancel
            </button>
            <button type="button" class="btn btn-sm btn-primary" @click="add">
                Add project
            </button>
        </div>
    </Modal>
</template>

<script>
import { mapActions } from 'vuex'
import { Project as ProjectModel } from '@lib/frameworks/project'
import Modal from '@/components/modals/Modal'

export default {
    name: 'AddProject',
    components: {
        Modal
    },
    data () {
        return {
            project: ''
        }
    },
    methods: {
        add () {
            // @TODO: Validate project name
            this.addProject(new ProjectModel(this.project))
            this.$emit('hide')
            this.$modal.open('AddRepositories')
        },
        ...mapActions({
            addProject: 'config/addProject'
        })
    }
}
</script>
