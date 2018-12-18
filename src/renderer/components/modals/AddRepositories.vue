<template>
    <Modal
        :dismissable="false"
        :title="project ? $string.set('Add repositories to :0', project.name) : 'Add repositories'"
        help="Add as many repositories as you want (you can always add more later). We'll scan the repositories above to look for testing frameworks."
    >
        <form>
            <h5>Repositories</h5>
            <dl v-for="(slot, index) in slots" :key="index" class="form-group">
                <dd class="d-flex">
                    <input
                        type="text"
                        class="form-control input-block input-sm"
                        v-model="slot.path"
                        placeholder="Repository path"
                    >
                    <button class="btn btn-sm" type="button" @click="choose(index)">Choose</button>
                    <button class="remove-row" type="button" @click="removeRow(index)">
                        <Icon symbol="x" />
                    </button>
                </dd>
            </dl>
            <dl class="form-group">
                <button type="button" class="btn btn-sm" @click="addRow">
                    Add another repository
                </button>
            </dl>
        </form>
        <div slot="footer" class="modal-footer tertiary separated">
            <button type="button" class="btn btn-sm" @click="$emit('hide')">
                Cancel
            </button>
            <button type="button" class="btn btn-sm btn-primary">
                Add repositories
            </button>
        </div>
    </Modal>
</template>

<script>
import { remote } from 'electron'
import { mapGetters } from 'vuex'

import Modal from '@/components/modals/Modal'

export default {
    name: 'AddRepositories',
    components: {
        Modal
    },
    data () {
        return {
            slots: [{
                path: ''
            }]
        }
    },
    computed: {
        ...mapGetters({
            project: 'config/currentProject'
        })
    },
    methods: {
        addRow () {
            this.slots.push({ path: '' })
        },
        removeRow (index) {
            this.slots.splice(index, 1)
            if (!this.slots.length) {
                this.addRow()
            }
        },
        async choose (index) {
            const directory = remote.dialog.showOpenDialog({
                properties: ['createDirectory', 'openDirectory']
            })

            if (!directory) {
                return
            }

            this.slots[index].path = directory[0]
        }
    }
}
</script>
