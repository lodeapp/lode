<template>
    <Modal :title="project ? $string.set('Add repositories to :0', project.name) : 'Add repositories'">
        <form @submit.prevent="handleSubmit">
            <h5>Repositories</h5>
            <RepositoryPath
                v-for="(slot, index) in slots"
                :key="slot.key"
                :validator="slot.validator"
                @input="onPathEdit(index, $event)"
                @remove="removeRow(index)"
            />
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
            <button type="button" class="btn btn-sm btn-primary" :disabled="empty" @click="add">
                Add repositories
            </button>
        </div>
    </Modal>
</template>

<script>
import _uniqBy from 'lodash/uniqBy'
import { mapActions } from 'vuex'
import { RepositoryValidator } from '@main/lib/frameworks/validator'

import Modal from '@/components/modals/Modal'
import RepositoryPath from '@/components/RepositoryPath'

export default {
    name: 'AddRepositories',
    components: {
        Modal,
        RepositoryPath
    },
    props: {
        project: {
            type: Object,
            required: true
        }
    },
    data () {
        return {
            slots: []
        }
    },
    computed: {
        empty () {
            return this.slots.filter(slot => slot.path).length === 0
        },
        hasErrors () {
            return this.slots.filter(slot => !slot.validator.isValid()).length > 0
        }
    },
    created () {
        this.addRow()
    },
    methods: {
        addRow () {
            this.slots.push({
                key: this.$string.random(),
                validator: new RepositoryValidator(this.project.repositories.map(repository => repository.path)),
                errored: false,
                path: ''
            })
        },
        removeRow (index) {
            this.slots.splice(index, 1)
            if (!this.slots.length) {
                this.addRow()
            }
        },
        onPathEdit (index, path) {
            this.slots[index].errored = false
            this.slots[index].path = path
        },
        handleSubmit () {
            if (this.empty) {
                return
            }
            this.add()
        },
        add () {
            this.slots.forEach((slot, index) => {
                slot.validator.validate({ path: slot.path })
            })

            if (!this.hasErrors) {
                _uniqBy(this.slots, 'path').forEach((slot, index) => {
                    this.addRepository(this.project.addRepository({ path: slot.path }))
                })
                this.$emit('hide')
            }
        },
        ...mapActions({
            addRepository: 'projects/addRepository'
        })
    }
}
</script>
