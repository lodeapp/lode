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
                <dd>
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
                <dd>
                    <select class="form-control form-select input-sm" v-model="fields.type">
                        <option>Select Test Framework</option>
                        <option value="jest">Jest</option>
                        <option value="phpunit">PHPUnit</option>
                    </select>
                </dd>
            </dl>
            <dl>
                <dt>
                    <label>Command</label>
                </dt>
                <dd>
                    <input
                        type="text"
                        class="form-control input-sm"
                        v-model="fields.command"
                        placeholder=""
                    >
                </dd>
            </dl>
            <dl>
                <dt>
                    <label>Tests path</label>
                </dt>
                <dd>
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
                    <label>Runs in VM</label>
                </dt>
                <dd>
                    <label>
                        <input type="radio" :value="false" v-model="fields.runsInVm">
                        No
                    </label>
                    <label>
                        <input type="radio" :value="true" v-model="fields.runsInVm">
                        Yes
                    </label>
                </dd>
            </dl>
            <dl v-show="fields.runsInVm">
                <dt>
                    <label>Path inside VM</label>
                </dt>
                <dd>
                    <input
                        type="text"
                        class="form-control input-sm"
                        v-model="fields.vmPath"
                        placeholder="(Optional)"
                    >
                </dd>
            </dl>
            <div class="form-actions">
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
import * as Path from 'path'
import { remote } from 'electron'

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
        }
    },
    data () {
        return {
            fields: {
                name: this.framework.name,
                type: this.framework.type,
                command: this.framework.command,
                path: this.framework.path,
                runsInVm: !!this.framework.vmPath,
                vmPath: this.framework.vmPath
            },
            expanded: this.expand || ['pending', 'removed'].includes(this.framework.scanStatus),
            pending: this.framework.scanStatus === 'pending',
            removed: this.framework.scanStatus === 'removed'
        }
    },
    watch: {
        fields: {
            handler (value) {
                this.$emit('input', value)
            },
            deep: true
        }
    },
    methods: {
        async choose (index) {
            const directory = remote.dialog.showOpenDialog({
                properties: ['createDirectory', 'openDirectory']
            })

            if (!directory) {
                return
            }

            this.path = Path.relative(this.repository.path, directory[0])
        },
        remove () {
            this.$emit('remove')
        }
    }
}
</script>
