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
                    <!-- <span class="counters">
                        <span class="Label Label--outline Label--queued">
                            {{ repository.scanned.length }} frameworks
                        </span>
                        <span class="Label Label--outline Label--incomplete">
                            {{ repository.scanned.length }} pending
                        </span>
                        <span class="Label Label--outline Label--failed">
                            {{ repository.scanned.length }} removed
                        </span>
                    </span> -->
                    <button type="button" class="btn btn-sm" @click="scan">Scan</button>
                </h5>
                <FrameworkSettings
                    v-for="(framework, index) in frameworks"
                    :key="framework.id || $string.random()"
                    :repository="repository"
                    :framework="framework"
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

import Modal from '@/components/modals/Modal'
import FrameworkSettings from '@/components/FrameworkSettings'

export default {
    name: 'AddFrameworks',
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
            frameworks: []
        }
    },
    created () {
        this.parseFrameworks(this.scanned, this.pending)
    },
    methods: {
        parseFrameworks (scanned = false, pending = []) {
            const types = pending.map(options => options.type)
            const frameworks = this.repository.frameworks.map(framework => {
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

            this.frameworks = frameworks.concat(scanned ? pending : [])
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
            this.frameworks.splice(index, 1)
        },
        save () {
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
            this.$emit('hide')
        },
        ...mapActions({
            addFramework: 'config/addFramework'
        })
    }
}
</script>
