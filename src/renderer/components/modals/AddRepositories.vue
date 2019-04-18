<template>
    <Modal :title="$root.project ? $string.set('Add repositories to :0', $root.project.name) : 'Add repositories'">
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
            <button type="button" class="btn btn-sm" @click="cancel" :disabled="loading">
                Cancel
            </button>
            <button type="button" class="btn btn-sm btn-primary" :disabled="empty || loading" @click="add">
                Add repositories
            </button>
        </div>
    </Modal>
</template>

<script>
import _uniqBy from 'lodash/uniqBy'
import { RepositoryValidator } from '@lib/frameworks/validator'

import Modal from '@/components/modals/Modal'
import RepositoryPath from '@/components/RepositoryPath'
import Confirm from '@/components/modals/mixins/confirm'

export default {
    name: 'AddRepositories',
    components: {
        Modal,
        RepositoryPath
    },
    mixins: [Confirm],
    data () {
        return {
            loading: false,
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
                validator: new RepositoryValidator(this.$root.project.repositories.map(repository => repository.path)),
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
                this.loading = true
                Promise.all(_uniqBy(this.slots, 'path').map((slot, index) => {
                    return this.$root.project.addRepository({ path: slot.path })
                })).then(repositories => {
                    this.$root.project.save()
                    this.confirm(repositories)
                })
            }
        }
    }
}
</script>
