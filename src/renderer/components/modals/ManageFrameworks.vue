<template>
    <Modal :title="singleFramework ? 'Framework Settings' : 'Manage test frameworks'" :key="repository.getId()">
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
                <FrameworkSettings
                    v-for="filtered in filteredFrameworks"
                    :key="filtered.key"
                    :repository="repository"
                    :framework="filtered"
                    :validator="filtered.validator"
                    :dedicated="singleFramework"
                    @input="handleChange(filtered, $event)"
                    @remove="handleRemove(filtered)"
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
import _isEmpty from 'lodash/isEmpty'
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
            return this.frameworks.filter(framework => framework.id === this.framework.getId())
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
        this.parseFrameworks()
        if (this.scan) {
            this.handleScan()
        }
    },
    methods: {
        parseFrameworks (scanned = false, pending = []) {
            const types = pending.map(options => options.type)
            const frameworks = this.repository.frameworks.map(framework => {
                // If an existing framework has been removed, but user has
                // triggered scan again, continue. This means the existing
                // framework object will be removed, while a new, pristine
                // object will be added.
                if (this.removed.includes(framework.getId())) {
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
                    repositoryPath: this.repository.getPath()
                }))
            })
        },
        async handleScan () {
            this.scanning = true
            await this.repository.scan()
                .then(pending => {
                    this.parseFrameworks(true, pending)
                    this.scanning = false
                })
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
        save () {
            this.frameworks.forEach(framework => {
                framework.validator.validate(framework)
            })

            if (!this.hasErrors) {
                this.frameworks
                    .filter(framework => framework.scanStatus === 'pending' || framework.dirty)
                    .forEach(framework => {
                        // If the framework has an id (i.e. exists), update it, otherwise add.
                        if (framework.id) {
                            const index = _findIndex(this.repository.frameworks, existing => existing.getId() === framework.id)
                            this.repository.frameworks[index].updateOptions({
                                ...framework,
                                ...{ repositoryPath: this.repository.getPath() }
                            })
                            return true
                        }
                        this.repository.addFramework(framework)
                            .then(framework => {
                                setTimeout(() => {
                                    framework.refresh()
                                }, 50)
                            })
                    })

                this.removeFrameworks()
                this.repository.save()

                this.$emit('hide')
            }
        },
        removeFrameworks () {
            // Remove duplicate ids.
            this.removed = [...new Set(this.removed)]
            // Iterate through frameworks marked for removal and trigger
            // the removal action on their parent repository.
            this.removed.forEach(frameworkId => {
                this.$root.onModelRemove(frameworkId)
                this.removeFramework({ repository: this.repository, frameworkId })
            })
        },
        ...mapActions({
            removeFramework: 'projects/removeFramework',
            repositoryChange: 'projects/repositoryChange'
        })
    }
}
</script>
