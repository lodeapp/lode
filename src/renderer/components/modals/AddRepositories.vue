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
                <button type="button" class="btn btn-sm" @click="addRow()">
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
import { ipcRenderer, remote } from 'electron'
import _find from 'lodash/find'
import _uniqBy from 'lodash/uniqBy'
import Modal from '@/components/modals/Modal'
import Confirm from '@/components/modals/mixins/confirm'
import Validator from '@/helpers/validator'

export default {
    name: 'AddRepositories',
    components: {
        Modal
    },
    mixins: [Confirm],
    props: {
        directories: {
            type: Array,
            default: null
        }
    },
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
        if (this.directories && this.directories.length) {
            this.populate(this.directories)
        }
    },
    methods: {
        async choose (index) {
            remote.dialog.showOpenDialog({
                properties: ['openDirectory', 'multiSelections']
            }).then(({ filePaths }) => {
                if (!filePaths || !filePaths.length) {
                    return
                }

                this.populate(filePaths, index)
            })
        },
        populate (filePaths, offset) {
            filePaths.forEach((path, index) => {
                if (!_find(this.slots, { path })) {
                    // If this is the first chosen file path, replace at given offset.
                    if (index === 0) {
                        this.slots[offset].path = path
                    // Otherwise, check subsequent slots to see if they're
                    // empty and populate, or add row if not.
                    } else if (this.slots[index + offset] && !this.slots[index + offset].path) {
                        this.slots[index + offset].path = path
                    } else {
                        this.addRow(path)
                    }
                    // Reset path validation errors at given offset
                    this.$nextTick(() => {
                        this.slots[index + offset].validator.reset('path')
                    })
                }
            })
        },
        addRow (path = '') {
            this.slots.push({
                key: this.$string.random(),
                validator: new Validator(),
                path
            })
            if (!path) {
                this.$nextTick(() => {
                    const inputs = this.$el.querySelectorAll('input[type=text]')
                    if (inputs && inputs.length) {
                        try {
                            inputs[inputs.length - 1].focus()
                        } catch (_) {
                            // Fail silently if we can't focus on last input.
                        }
                    }
                })
            }
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
        async add () {
            // Validate each slot before checking for errors in the form.
            for (let i = this.slots.length - 1; i >= 0; i--) {
                this.slots[i].validator.refresh(JSON.parse(
                    await ipcRenderer.invoke('repository-validate', { path: this.slots[i].path })
                ))
            }

            if (!this.hasErrors) {
                this.loading = true
                ipcRenderer
                    .once('repository-added', (event, payload) => {
                        this.$payload(payload, repositories => {
                            this.confirm({
                                repositories,
                                autoScan: this.autoScan
                            })
                        })
                    })
                    .send('repository-add', _uniqBy(this.slots, 'path').map(slot => slot.path))
            }
        }
    }
}
</script>
