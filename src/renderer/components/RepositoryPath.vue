<template>
    <dl class="form-group" :class="{ errored: validator.hasErrors('path') }">
        <dd class="d-flex">
            <input
                type="text"
                class="form-control input-block input-sm"
                v-model="path"
                placeholder="Repository path"
            >
            <button class="btn btn-sm" type="button" @click="choose">Choose</button>
            <button class="remove-row tooltipped tooltipped-nw" type="button" @click="$emit('remove')" aria-label="Clear row">
                <Icon symbol="x" />
            </button>
        </dd>
        <dd v-if="validator.hasErrors('path')" class="form-error">{{ validator.getErrors('path') }}</dd>
    </dl>
</template>

<script>
import { remote } from 'electron'

export default {
    name: 'RepositoryPath',
    props: {
        validator: {
            type: Object,
            required: true
        }
    },
    data () {
        return {
            path: ''
        }
    },
    watch: {
        path (value) {
            this.$emit('input', value)
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

            this.path = directory[0]
        }
    }
}
</script>
