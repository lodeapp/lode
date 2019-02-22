<template>
    <Modal title="Preferences">
        <form class="preferences" @submit.prevent="handleSubmit">
            <div class="form-group">
                <dl>
                    <dt><label for="project-name">Concurrent process limit:</label></dt>
                    <dd>
                        <div class="form-help">Decrease if you experience slow performance.</div>
                        <select class="form-control form-select input-sm" v-model="concurrency">
                            <option>1</option>
                            <option>2</option>
                            <option>3</option>
                            <option>4</option>
                            <option>5</option>
                        </select>
                    </dd>
                </dl>
                <dl>
                    <dt><label>Show confirmation dialog:</label></dt>
                    <dd class="checkbox-list">
                        <label>
                            <input type="checkbox" checked="checked" v-model="confirmSwitchProject">
                            When switching from non-idle projects
                        </label>
                    </dd>
                </dl>
            </div>
        </form>
        <div slot="footer" class="modal-footer tertiary flex-justify-end">
            <button type="button" class="btn btn-sm btn-primary" @click="$emit('hide')">
                Done
            </button>
        </div>
    </Modal>
</template>

<script>
import { state } from '@main/lib/state'
import Modal from '@/components/modals/Modal'

export default {
    name: 'Preferences',
    components: {
        Modal
    },
    computed: {
        concurrency: {
            get () {
                return state.get('concurrency')
            },
            set (value) {
                return state.set('concurrency', value)
            }
        },
        confirmSwitchProject: {
            get () {
                return state.get('confirm.switchProject')
            },
            set (value) {
                return state.set('confirm.switchProject', value)
            }
        }
    },
    methods: {
        handleSubmit () {
            this.$emit('hide')
        }
    }
}
</script>
