<template>
    <Modal
        :dismissable="false"
        title="Manage test frameworks"
    >
        <div class="fluid">
            <div class="repository-settings">
                <h5>
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
                    <button type="button" class="btn btn-sm" @click="scan">Scan</button>
                </h5>
                <FrameworkSettings
                    v-for="(framework, index) in frameworks"
                    :key="framework.key"
                    :repository="repository"
                    :framework="framework"
                    :validator="framework.validator"
                    @input="handleChange(index, $event)"
                    @remove="handleRemove(index)"
                />
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
import { mapActions } from 'vuex'
import _findIndex from 'lodash/findIndex'
import { FrameworkValidator } from '@lib/frameworks/validator'

import Modal from '@/components/modals/Modal'
import FrameworkSettings from '@/components/FrameworkSettings'

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
        scanned: {
            type: Boolean,
            default: false
        },
        pending: {
            type: Array,
            default () {
                return []
            }
        }
    },
    data () {
        return {
            frameworks: [],
            removed: []
        }
    },
    computed: {
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
        this.parseFrameworks(this.scanned, this.pending)
    },
    methods: {
        parseFrameworks (scanned = false, pending = []) {
            const types = pending.map(options => options.type)
            const frameworks = this.repository.frameworks.map(framework => {
                // If an existing framework has been removed, but user has
                // triggered scan again, continue. This means the existing
                // framework object will be removed, while a new, pristine
                // object will be added.
                if (this.removed.includes(framework.id)) {
                    return false
                }

                const options = framework.persist()
                if (!scanned || framework.type === 'custom') {
                    return options
                }
                if (!types.includes(framework.type)) {
                    // If type is not custom and is not found in the scanned array, mark as removed.
                    options.scanStatus = 'removed'
                } else {
                    // But if type exists in the scan, remove from scanned array.
                    pending = pending.filter(options => options.type !== framework.type)
                }

                return options
            })

            // Parsed frameworks are joined by pending ones (if any) when we're
            // processing scanned frameworks. Also, filter out falsy values from
            // the array, in case we skipped any existing framework during map.
            this.frameworks = frameworks.filter(Boolean).concat(scanned ? pending : [])

            // Add a reactive validator instance to the mapped frameworks
            this.frameworks.forEach(framework => {
                this.$set(framework, 'key', framework.id || this.$string.random())
                this.$set(framework, 'validator', new FrameworkValidator({
                    repositoryPath: this.repository.path
                }))
            })
        },
        scan () {
            this.repository.scan()
                .then(pending => {
                    this.parseFrameworks(true, pending)
                })
        },
        handleChange (index, values) {
            this.frameworks[index] = { ...this.frameworks[index], ...values, ...{ dirty: true }}
        },
        handleRemove (index) {
            const removed = this.frameworks.splice(index, 1)
            // If framework already exists, mark for removal if changes are saved
            if (removed[0].id) {
                this.removed.push(removed[0].id)
            }
        },
        save () {
            this.frameworks.forEach(framework => {
                framework.validator.validate(framework)
            })

            if (!this.hasErrors) {
                this.frameworks
                    .filter(framework => framework.scanStatus === 'pending' || framework.dirty)
                    .forEach(framework => {
                        if (framework.id) {
                            const frameworkIndex = _findIndex(this.repository.frameworks, { id: framework.id })
                            this.repository.frameworks[frameworkIndex].updateOptions({
                                ...framework,
                                ...{ repositoryPath: this.repository.path }
                            })
                            return true
                        }
                        this.addFramework({ repositoryId: this.repository.id, framework: this.repository.addFramework(framework) })
                    })

                this.removeFrameworks()

                this.$emit('hide')
            }
        },
        removeFrameworks () {
            // Remove duplicate ids.
            this.removed = [...new Set(this.removed)]
            // Iterate through frameworks marked for removal and splice them
            // from their parent repository.
            this.removed.forEach(frameworkId => {
                this.repository.removeFramework(frameworkId)
            })
            // Finally, persist the changes in the config.
            this.repositoryChange(this.repository)
        },
        ...mapActions({
            addFramework: 'config/addFramework',
            repositoryChange: 'config/repositoryChange'
        })
    }
}
</script>
