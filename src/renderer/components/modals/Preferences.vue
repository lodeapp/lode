<template>
    <Modal title="Preferences">
        <form class="preferences" @submit.prevent="close">
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
        <template #footer>
            <div class="modal-footer tertiary flex-justify-end">
                <button type="button" class="btn btn-sm btn-primary" @click="close">
                    Done
                </button>
            </div>
        </template>
    </Modal>
</template>

<script>
import Modal from '@/components/modals/mixins/modal'

export default {
    name: 'Preferences',
    mixins: [Modal],
    computed: {
        concurrency: {
            get () {
                return this.$root.setting('concurrency')
            },
            set (value) {
                this.$root.updateSetting('concurrency', value)
            }
        },
        confirmSwitchProject: {
            get () {
                return this.$root.setting('confirm.switchProject')
            },
            set (value) {
                this.$root.updateSetting('confirm.switchProject', value)
            }
        }
    }
}
</script>
