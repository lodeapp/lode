<template>
    <div
        class="form-group framework-settings"
        :class="{
            'status--pending': pending,
            'status--removed': removed,
            'is-dedicated': dedicated,
            'is-expanded': expanded,
            'is-collapsed': !expanded
        }"
    >
        <div v-if="expanded">
            <div v-if="!dedicated" class="help">
                <template v-if="pending">
                    <div>This framework was found during a scan of the repository. Check the settings below and save changes to add, or <a @click="remove">ignore this framework</a>.</div>
                </template>
                <template v-else-if="removed">
                    <div>This framework was not found during a scan of the repository. You might want to remove it.</div>
                </template>
            </div>
            <div v-if="!dedicated" class="counter"></div>
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
                        <option value="">Select Test Framework</option>
                        <option
                            v-for="available in availableFrameworks"
                            :key="available.getDefaults().type"
                            :value="available.getDefaults().type"
                        >{{ available.getDefaults().name }}</option>
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
            <dl v-if="fields.type === 'phpunit'">
                <dt>
                    <label>Autoload path</label>
                </dt>
                <dd :class="{ errored: validator.hasErrors('autoloadPath') }">
                    <div v-if="validator.hasErrors('autoloadPath')" class="form-error">{{ validator.getErrors('autoloadPath') }}</div>
                    <input
                        type="text"
                        class="form-control input-sm"
                        v-model="fields.proprietary.autoloadPath"
                        placeholder="vendor/autoload.php"
                    >
                    <button class="btn btn-sm" type="button" @click="chooseAutoloadPath">Choose</button>
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
                    <button class="btn btn-sm" type="button" @click="chooseTestsPath">Choose</button>
                </dd>
            </dl>
            <dl>
                <dt>
                    <label>Runs in remote machine</label>
                </dt>
                <dd>
                    <label>
                        <input type="radio" :value="false" v-model="fields.runsInRemote">
                        No
                    </label>
                    <label>
                        <input type="radio" :value="true" v-model="fields.runsInRemote">
                        Yes
                    </label>
                </dd>
            </dl>
            <div v-show="fields.runsInRemote">
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
                    <dd :class="{ errored: validator.hasErrors('sshHost') }">
                        <div v-if="validator.hasErrors('sshHost')" class="form-error">{{ validator.getErrors('sshHost') }}</div>
                        <input
                            type="text"
                            class="form-control input-sm"
                            v-model="fields.sshHost"
                            placeholder="(Optional)"
                        >
                    </dd>
                </dl>
                <dl>
                    <dt>
                        <label>SSH User</label>
                    </dt>
                    <dd :class="{ errored: validator.hasErrors('sshUser') }">
                        <div v-if="validator.hasErrors('sshUser')" class="form-error">{{ validator.getErrors('sshUser') }}</div>
                        <input
                            type="text"
                            class="form-control input-sm"
                            v-model="fields.sshUser"
                            placeholder="(Optional)"
                        >
                    </dd>
                </dl>
                <dl>
                    <dt>
                        <label>SSH Port</label>
                    </dt>
                    <dd :class="{ errored: validator.hasErrors('sshPort') }">
                        <div v-if="validator.hasErrors('sshPort')" class="form-error">{{ validator.getErrors('sshPort') }}</div>
                        <input
                            type="text"
                            class="form-control input-sm"
                            v-model="fields.sshPort"
                            placeholder="(Optional)"
                        >
                    </dd>
                </dl>
                <dl>
                    <dt>
                        <label>Identity file</label>
                    </dt>
                    <dd :class="{ errored: validator.hasErrors('sshIdentity') }">
                        <div class="form-help">If different than `ssh-config` settings.</div>
                        <div v-if="validator.hasErrors('sshIdentity')" class="form-error">{{ validator.getErrors('sshIdentity') }}</div>
                        <input
                            type="text"
                            class="form-control input-sm"
                            v-model="fields.sshIdentity"
                            placeholder="(Optional)"
                        >
                        <button class="btn btn-sm" type="button" @click="chooseIdentity">Choose</button>
                    </dd>
                </dl>
            </div>
            <div class="instructions" v-show="instructions && currentFrameworkInstructions">
                <div>
                    <h6>{{ 'How to setup :0 testing with Lode' | set(currentFrameworkName) }}</h6>
                    <p v-markdown>{{ currentFrameworkInstructions }}</p>
                </div>
            </div>
            <div v-if="!dedicated" class="form-actions">
                <button v-if="currentFrameworkInstructions" class="btn btn-outline btn-sm" type="button" @click="instructions = !instructions">
                    <Icon symbol="question" />
                </button>
                <button class="btn btn-sm btn-danger" type="button" @click="remove">Remove</button>
                <button class="btn btn-sm" type="button" @click="expanded = !expanded">Done</button>
            </div>
        </div>
        <div v-else @mousedown="expanded = !expanded">
            <div class="counter"></div>
            <h6>{{ fields.name }}</h6>
            <Icon symbol="unfold" />
        </div>
    </div>
</template>

<script>
import * as Path from 'path'
import { remote } from 'electron'
import { getFrameworkByType, Frameworks } from '@lib/frameworks'

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
        },
        dedicated: {
            type: Boolean,
            default: false
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
                sshHost: this.framework.sshHost,
                sshUser: this.framework.sshUser,
                sshPort: this.framework.sshPort,
                sshIdentity: this.framework.sshIdentity,
                proprietary: this.framework.proprietary
            },
            expanded: this.dedicated || ['pending', 'removed'].includes(this.framework.scanStatus),
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
        frameworkType () {
            return getFrameworkByType(this.fields.type)
        },
        currentFrameworkName () {
            return this.frameworkType ? this.frameworkType.getDefaults().name : ''
        },
        currentFrameworkInstructions () {
            return this.frameworkType ? this.frameworkType.instructions() : ''
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
        async chooseAutoloadPath () {
            remote.dialog.showOpenDialog({
                defaultPath: this.repository.getPath(),
                properties: ['openFile']
            }).then(({ filePaths }) => {
                if (!filePaths || !filePaths.length) {
                    return
                }

                this.fields.proprietary.autoloadPath = Path.relative(this.repository.getPath(), filePaths[0])
                this.validator.reset('autoloadPath')
            })
        },
        async chooseTestsPath () {
            remote.dialog.showOpenDialog({
                defaultPath: this.repository.getPath(),
                properties: ['createDirectory', 'openDirectory']
            }).then(({ filePaths }) => {
                if (!filePaths || !filePaths.length) {
                    return
                }

                this.fields.path = Path.relative(this.repository.getPath(), filePaths[0])
                this.validator.reset('path')
            })
        },
        async chooseIdentity () {
            remote.dialog.showOpenDialog({
                properties: ['openFile', 'showHiddenFiles'],
                message: 'Choose a custom SSH key file to use with this connection.\nNote that ~/.ssh/id_rsa and identities defined in your SSH configuration are included by default.'
            }).then(({ filePaths }) => {
                if (!filePaths || !filePaths.length) {
                    return
                }

                this.fields.sshIdentity = filePaths[0]
                this.validator.reset('sshIdentity')
            })
        },
        remove () {
            this.$emit('remove')
        }
    }
}
</script>
