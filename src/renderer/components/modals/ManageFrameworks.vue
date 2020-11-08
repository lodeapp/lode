<template>
    <Modal :title="singleFramework ? 'Framework Settings' : 'Manage test frameworks'" :key="repository.id">
        <div class="fluid">
            <div class="repository-settings">
                <h5 v-if="!singleFramework">
                    <span class="repository-name">
                        <Icon symbol="repo" />{{ repository.name }}
                    </span>
                    <span class="counters">
                        <span v-if="frameworks.length === 0 || amountActive" class="Label Label--outline Label--normal">
                            {{ frameworks.length === 0 ? 'No frameworks' : $string.plural('1 framework|:n frameworks', amountActive) }}
                        </span>
                        <span v-if="amountPending" class="Label Label--outline Label--pending">
                            {{ '1 pending|:n pending' | plural(amountPending) }}
                        </span>
                        <span v-if="amountRemoved" class="Label Label--outline Label--removed">
                            {{ '1 removed|:n removed' | plural(amountRemoved) }}
                        </span>
                    </span>
                    <button type="button" class="btn btn-sm" @click="handleScan" :disabled="scanning">Scan</button>
                </h5>
                <template v-if="availableFrameworks">
                    <FrameworkSettings
                        v-for="filtered in filteredFrameworks"
                        :key="filtered.key"
                        :repository="repository"
                        :framework="filtered"
                        :validator="filtered.validator"
                        :dedicated="singleFramework"
                        :available-frameworks="availableFrameworks"
                        @input="handleChange(filtered, $event)"
                        @remove="handleRemove(filtered)"
                    />
                </template>
            </div>
        </div>
        <div slot="footer" class="modal-footer tertiary separated">
            <button type="button" class="btn btn-sm" @click="$emit('hide')">
                Cancel
            </button>
            <button type="button" class="btn btn-sm btn-primary" @click="save">
                Save changes
            </button>
        </div>
    </Modal>
</template>

<script>
import _findIndex from 'lodash/findIndex'
import _isEmpty from 'lodash/isEmpty'
import Modal from '@/components/modals/Modal'
import FrameworkSettings from '@/components/FrameworkSettings'
import Validator from '@/helpers/validator'

export default {
    name: 'ManageFrameworks',
    components: {
        Modal,
        FrameworkSettings
    },
    props: {
        repository: {
            type: Object,
            required: true
        },
        framework: {
            type: Object,
            default () {
                return {}
            }
        },
        scan: {
            type: Boolean,
            default: false
        }
    },
    data () {
        return {
            availableFrameworks: null,
            scanning: false,
            frameworks: [],
            removed: []
        }
    },
    computed: {
        singleFramework () {
            return !_isEmpty(this.framework)
        },
        filteredFrameworks () {
            if (!this.singleFramework) {
                return this.frameworks
            }
            return this.frameworks.filter(framework => framework.id === this.framework.id)
        },
        amountActive () {
            return this.frameworks.filter(framework => !framework.scanStatus).length
        },
        amountPending () {
            return this.frameworks.filter(framework => framework.scanStatus === 'pending').length
        },
        amountRemoved () {
            return this.frameworks.filter(framework => framework.scanStatus === 'removed').length
        },
        hasErrors () {
            return this.frameworks.filter(framework => !framework.validator.isValid()).length > 0
        }
    },
    created () {
        Lode.ipc.invoke('framework-types').then(payload => {
            this.availableFrameworks = JSON.parse(payload)
        })

        this.parseFrameworks()
        if (this.scan) {
            this.handleScan()
        }
    },
    methods: {
        async parseFrameworks (scanned = false, pending = []) {
            const types = pending.map(p => p.type)
            const frameworks = (JSON.parse(await Lode.ipc.invoke('repository-frameworks', this.repository.id)))
                .map(framework => {
                    // If an existing framework has been removed, but user has
                    // triggered scan again, continue. This means the existing
                    // framework object will be removed, while a new, pristine
                    // object will be added.
                    if (this.removed.includes(framework.id)) {
                        return false
                    }

                    if (!scanned || framework.type === 'custom') {
                        return framework
                    }
                    if (!types.includes(framework.type)) {
                        // If type is not custom and is not found in the scanned array, mark as removed.
                        framework.scanStatus = 'removed'
                    } else {
                        // But if type exists in the scan, remove from scanned array.
                        pending = pending.filter(p => p.type !== framework.type)
                    }

                    return framework
                })

            // Parsed frameworks are joined by pending ones (if any) when we're
            // processing scanned frameworks. Also, filter out falsy values from
            // the array, in case we skipped any existing framework during map.
            this.frameworks = frameworks.filter(Boolean).concat(scanned ? pending : [])

            // Add a reactive validator instance to the mapped frameworks
            this.frameworks.forEach(framework => {
                this.$set(framework, 'key', framework.id || this.$string.random())
                this.$set(framework, 'validator', new Validator())
            })
        },
        async handleScan () {
            this.scanning = true
            this.parseFrameworks(true, JSON.parse(
                await Lode.ipc.invoke('repository-scan', this.repository.id))
            )
            this.scanning = false
        },
        handleChange (framework, values) {
            const index = _findIndex(this.frameworks, { key: framework.key })
            if (index > -1) {
                this.frameworks[index] = { ...this.frameworks[index], ...values, ...{ dirty: true }}
            }
        },
        handleRemove (framework) {
            const index = _findIndex(this.frameworks, { key: framework.key })
            if (index > -1) {
                const removed = this.frameworks.splice(index, 1)
                // If framework already exists, mark for removal if changes are saved
                if (removed[0].id) {
                    this.removed.push(removed[0].id)
                }
            }
        },
        async save () {
            // Validate each slot before checking for errors in the form.
            for (let i = this.frameworks.length - 1; i >= 0; i--) {
                this.frameworks[i].validator.refresh(JSON.parse(
                    await Lode.ipc.invoke('framework-validate', this.repository.id, this.frameworks[i])
                ))
            }

            if (!this.hasErrors) {
                this.frameworks
                    .filter(framework => framework.scanStatus === 'pending' || framework.dirty)
                    .forEach(framework => {
                        // If the framework has an id (i.e. exists), update it, otherwise add.
                        if (framework.id) {
                            Lode.ipc.send('framework-update', framework.id, framework)
                            return
                        }
                        Lode.ipc.send('framework-add', this.repository.id, framework)
                    })

                this.removeFrameworks()

                this.$emit('hide')
            }
        },
        removeFrameworks () {
            // Remove duplicate ids.
            this.removed = [...new Set(this.removed)]
            // Iterate through frameworks marked for removal and trigger
            // the removal action on their parent repository.
            this.removed.forEach(framework => {
                this.$root.handleFrameworkRemove(framework)
            })
        }
    }
}
</script>
