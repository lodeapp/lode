<template>
    <Modal :title="$root.project ? $string.set('Add repositories to :0', $root.project.name) : 'Add repositories'">
        <form class="add-repositories" @submit.prevent="handleSubmit">
            <h5>Repositories</h5>
            <dl
                v-for="(slot, index) in slots"
                :key="slot.key"
                class="form-group"
                :class="{ errored: slot.validator.hasErrors('path') }"
            >
                <dd class="d-flex">
                    <input
                        type="text"
                        class="form-control input-block input-sm"
                        placeholder="Repository path"
                        v-model="slot.path"
                        @input="slot.validator.reset('path')"
                    >
                    <button class="btn btn-sm" type="button" @click="choose(index)">Choose</button>
                    <button class="remove-row tooltipped tooltipped-nw" type="button" @click="removeRow(index)" aria-label="Clear row">
                        <Icon symbol="x" />
                    </button>
                </dd>
                <dd v-if="slot.validator.hasErrors('path')" class="form-error">{{ slot.validator.getErrors('path') }}</dd>
            </dl>
            <dl class="form-group">
                <button type="button" class="btn btn-sm" @click="addRow">
                    Add another repository
                </button>
            </dl>
            <dl class="form-group auto-scan">
                <label>
                    <input type="checkbox" checked="checked" v-model="autoScan">
                    Scan repositories for frameworks after adding
                </label>
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
import { remote } from 'electron'
import _find from 'lodash/find'
import _uniqBy from 'lodash/uniqBy'
import { RepositoryValidator } from '@lib/frameworks/validator'

import Modal from '@/components/modals/Modal'
import Confirm from '@/components/modals/mixins/confirm'

export default {
    name: 'AddRepositories',
    components: {
        Modal
    },
    mixins: [Confirm],
    data () {
        return {
            loading: false,
            autoScan: true,
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
        async choose (index) {
            const directory = remote.dialog.showOpenDialog({
                properties: ['createDirectory', 'openDirectory', 'multiSelections']
            })

            if (!directory) {
                return
            }

            directory.forEach((path, index) => {
                if (!_find(this.slots, { path })) {
                    index === 0 ? this.slots[index].path = path : this.addRow(path)
                    this.slots[index].validator.reset('path')
                }
            })
        },
        addRow (path = '') {
            this.slots.push({
                key: this.$string.random(),
                validator: new RepositoryValidator(this.$root.project.repositories.map(repository => repository.path)),
                path
            })
        },
        removeRow (index) {
            this.slots.splice(index, 1)
            if (!this.slots.length) {
                this.addRow()
            }
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
                    this.confirm({
                        repositories,
                        autoScan: this.autoScan
                    })
                })
            }
        }
    }
}
</script>
