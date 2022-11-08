<template>
    <Modal title="Preferences">
        <form class="preferences" @submit.prevent="close">
            <div class="form-group">
                <dl>
                    <dt><label for="select-concurrency">Concurrent process limit:</label></dt>
                    <dd>
                        <div class="form-help">Decrease if you experience slow performance.</div>
                        <select id="select-concurrency" class="form-control form-select input-sm" v-model="concurrency">
                            <option>1</option>
                            <option>2</option>
                            <option>3</option>
                            <option>4</option>
                            <option>5</option>
                        </select>
                    </dd>
                </dl>
                <dl>
                    <dt><label>Show dialog:</label></dt>
                    <dd class="checkbox-list">
                        <label>
                            <input type="checkbox" checked="checked" v-model="confirmSwitchProject">
                            When switching from non-idle projects
                        </label>
                        <label>
                            <input type="checkbox" checked="checked" v-model="confirmRunningUnderTranslation">
                            When running application on the wrong architecture
                        </label>
                    </dd>
                </dl>
                <dl v-if="$root.supportsThemes">
                    <dt><label for="select-theme">Appearance</label></dt>
                    <dd>
                        <select id="select-theme" class="form-control form-select input-sm" v-model="theme">
                            <option value="light">Light</option>
                            <option value="dark">Dark</option>
                            <option value="system">System</option>
                        </select>
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
        },
        confirmRunningUnderTranslation: {
            get () {
                return this.$root.setting('confirm.runningUnderTranslation')
            },
            set (value) {
                this.$root.updateSetting('confirm.runningUnderTranslation', value)
            }
        },
        theme: {
            get () {
                return this.$root.setting('theme')
            },
            set (value) {
                this.$root.updateSetting('theme', value)
                Lode.ipc.send('set-theme', value)
            }
        }
    }
}
</script>
