<template>
    <div
        class="form-group framework-settings"
        :class="{
            'status--pending': pending,
            'status--removed': removed,
            'is-expanded': expanded,
            'is-collapsed': !expanded
        }"
    >
        <div v-if="expanded">
            <div class="help">
                <template v-if="pending">
                    <div>This framework was found during a scan of the repository. Check the settings below and save changes to add, or <a @click="remove">ignore this framework</a>.</div>
                </template>
                <template v-else-if="removed">
                    <div>This framework was not found during a scan of the repository. You might want to remove it.</div>
                </template>
            </div>
            <div class="counter"></div>
            <dl>
                <dt>
                    <label>Name</label>
                </dt>
                <dd :class="{ errored: validator.hasErrors('name') }">
                    <div v-if="validator.hasErrors('name')" class="form-error">{{ validator.getErrors('name') }}</div>
                    <input
                        type="text"
                        class="form-control input-sm"
                        v-model="fields.name"
                        placeholder=""
                    >
                </dd>
            </dl>
            <dl>
                <dt>
                    <label>Framework</label>
                </dt>
                <dd :class="{ errored: validator.hasErrors('type') }">
                    <div v-if="validator.hasErrors('type')" class="form-error">{{ validator.getErrors('type') }}</div>
                    <select class="form-control form-select input-sm" v-model="fields.type">
                        <option>Select Test Framework</option>
                        <option
                            v-for="framework in availableFrameworks"
                            :key="framework.defaults.type"
                            :value="framework.defaults.type"
                        >{{ framework.defaults.name }}</option>
                    </select>
                </dd>
            </dl>
            <dl>
                <dt>
                    <label>Command</label>
                </dt>
                <dd :class="{ errored: validator.hasErrors('command') }">
                    <div class="form-help">Commands are run from the repository's root directory.</div>
                    <div v-if="validator.hasErrors('command')" class="form-error">{{ validator.getErrors('command') }}</div>
                    <input
                        type="text"
                        class="form-control input-sm input-monospace"
                        v-model="fields.command"
                        placeholder=""
                    >
                </dd>
            </dl>
            <dl>
                <dt>
                    <label>Tests path</label>
                </dt>
                <dd :class="{ errored: validator.hasErrors('path') }">
                    <div class="form-help">Relative to the repository's path.</div>
                    <div v-if="validator.hasErrors('path')" class="form-error">{{ validator.getErrors('path') }}</div>
                    <input
                        type="text"
                        class="form-control input-sm"
                        v-model="fields.path"
                        placeholder="(Optional)"
                    >
                    <button class="btn btn-sm" type="button" @click="choose">Choose</button>
                </dd>
            </dl>
            <dl>
                <dt>
                    <label>Runs in local machine</label>
                </dt>
                <dd>
                    <label>
                        <input type="radio" :value="false" v-model="fields.runsInRemote">
                        Yes
                    </label>
                    <label>
                        <input type="radio" :value="true" v-model="fields.runsInRemote">
                        No
                    </label>
                </dd>
            </dl>
            <template v-show="fields.runsInRemote">
                <dl>
                    <dt>
                        <label>Remote repository path</label>
                    </dt>
                    <dd :class="{ errored: validator.hasErrors('remotePath') }">
                        <div class="form-help">Absolute path to repository inside remote machine.</div>
                        <div v-if="validator.hasErrors('remotePath')" class="form-error">{{ validator.getErrors('remotePath') }}</div>
                        <input
                            type="text"
                            class="form-control input-sm"
                            v-model="fields.remotePath"
                            placeholder="(Optional)"
                        >
                    </dd>
                </dl>
                <dl>
                    <dt>
                        <label>SSH Host</label>
                    </dt>
                    <dd :class="{ errored: validator.hasErrors('sshOptions.host') }">
                        <div v-if="validator.hasErrors('sshOptions.host')" class="form-error">{{ validator.getErrors('sshOptions.host') }}</div>
                        <input
                            type="text"
                            class="form-control input-sm"
                            v-model="fields.sshOptions.host"
                            placeholder="(Optional)"
                        >
                    </dd>
                </dl>
                <dl>
                    <dt>
                        <label>SSH User</label>
                    </dt>
                    <dd :class="{ errored: validator.hasErrors('sshOptions.user') }">
                        <div v-if="validator.hasErrors('sshOptions.user')" class="form-error">{{ validator.getErrors('sshOptions.user') }}</div>
                        <input
                            type="text"
                            class="form-control input-sm"
                            v-model="fields.sshOptions.user"
                            placeholder="(Optional)"
                        >
                    </dd>
                </dl>
                <dl>
                    <dt>
                        <label>SSH Port</label>
                    </dt>
                    <dd :class="{ errored: validator.hasErrors('sshOptions.port') }">
                        <div v-if="validator.hasErrors('sshOptions.port')" class="form-error">{{ validator.getErrors('sshOptions.port') }}</div>
                        <input
                            type="text"
                            class="form-control input-sm"
                            v-model="fields.sshOptions.port"
                            placeholder="(Optional)"
                        >
                    </dd>
                </dl>
                <dl>
                    <dt>
                        <label>Identity file</label>
                    </dt>
                    <dd :class="{ errored: validator.hasErrors('sshOptions.identity') }">
                        <div class="form-help">If different than `ssh-config` settings.</div>
                        <div v-if="validator.hasErrors('sshOptions.identity')" class="form-error">{{ validator.getErrors('sshOptions.identity') }}</div>
                        <input
                            type="text"
                            class="form-control input-sm"
                            v-model="fields.sshOptions.identity"
                            placeholder="(Optional)"
                        >
                        <button class="btn btn-sm" type="button" @click="chooseIdentity">Choose</button>
                    </dd>
                </dl>
            </template>
            <div class="instructions" v-show="instructions">
                <div>
                    <h6>{{ 'How to setup :0 testing with Lode' | set(currentFrameworkName) }}</h6>
                    <p v-markdown>{{ currentFrameworkInstructions }}</p>
                </div>
            </div>
            <div class="form-actions">
                <button class="btn btn-outline btn-sm" type="button" @click="instructions = !instructions"><Icon symbol="question" /></button>
                <button class="btn btn-sm btn-danger" type="button" @click="remove">Remove</button>
                <button class="btn btn-sm" type="button" @click="expanded = !expanded">Done</button>
            </div>
        </div>
        <div v-else @click="expanded = !expanded">
            <div class="counter"></div>
            <h6>{{ fields.name }}</h6>
            <Icon symbol="unfold" />
        </div>
    </div>
</template>

<script>
import _find from 'lodash/find'
import * as Path from 'path'
import { remote } from 'electron'
import { Frameworks } from '@lib/frameworks'

export default {
    name: 'FrameworkSettings',
    props: {
        repository: {
            type: Object,
            required: true
        },
        framework: {
            type: Object,
            required: true
        },
        validator: {
            type: Object,
            required: true
        }
    },
    data () {
        return {
            fields: {
                name: this.framework.name,
                type: this.framework.type,
                command: this.framework.command,
                path: this.framework.path,
                runsInRemote: this.framework.runsInRemote,
                remotePath: this.framework.remotePath,
                sshOptions: {
                    host: this.framework.sshOptions.host,
                    user: this.framework.sshOptions.user || '',
                    identity: this.framework.sshOptions.identity || '',
                    port: this.framework.sshOptions.port || ''
                }
            },
            expanded: ['pending', 'removed'].includes(this.framework.scanStatus),
            instructions: this.framework.scanStatus === 'pending'
        }
    },
    computed: {
        pending () {
            return this.framework.scanStatus === 'pending'
        },
        removed () {
            return this.framework.scanStatus === 'removed'
        },
        availableFrameworks () {
            return Frameworks
        },
        currentFrameworkName () {
            const framework = _find(Frameworks, framework => framework.defaults.type === this.fields.type)
            return framework ? framework.defaults.name : ''
        },
        currentFrameworkInstructions () {
            const framework = _find(Frameworks, framework => framework.defaults.type === this.fields.type)
            return framework ? framework.instructions() : ''
        }
    },
    watch: {
        validator: {
            handler (validator) {
                if (!validator.isValid()) {
                    this.expanded = true
                }
            },
            deep: true
        },
        fields: {
            handler (value) {
                this.$emit('input', value)
            },
            deep: true
        }
    },
    methods: {
        async choose () {
            const directory = remote.dialog.showOpenDialog({
                properties: ['createDirectory', 'openDirectory']
            })

            if (!directory) {
                return
            }

            this.fields.path = Path.relative(this.repository.path, directory[0])
            this.validator.reset('path')
        },
        async chooseIdentity () {
            const file = remote.dialog.showOpenDialog({
                properties: ['openFile', 'showHiddenFiles'],
                message: 'Choose a custom SSH key file to use with this connection.\nNote that ~/.ssh/id_rsa and identities defined in your SSH configuration are included by default.'
            })

            if (!file) {
                return
            }

            this.fields.sshOptions.identity = file[0]
            this.validator.reset('sshOptions.identity')
        },
        remove () {
            this.$emit('remove')
        }
    }
}
</script>
