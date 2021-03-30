<template>
    <span class="filename" :class="{ 'filename--truncate': truncate }">
        <template v-if="truncate">
            <span v-html="'&lrm;'"></span>{{ dir }}<strong>{{ name }}</strong>
        </template>
        <template v-else>
            <span class="dir" v-html="dir"></span>
            <span class="name" v-html="name"></span>
        </template>
    </span>
</template>

<script>
import * as Path from 'path'
import _escape from 'lodash/escape'

export default {
    name: 'Filename',
    props: {
        path: {
            type: String,
            required: true
        },
        root: {
            type: String,
            default: ''
        },
        truncate: {
            type: Boolean,
            default: false
        }
    },
    data () {
        return {
            dir: '',
            name: ''
        }
    },
    computed: {
        parsedPath () {
            if (!this.root || !this.path.startsWith('/')) {
                return this.path
            }
            return Path.relative(this.root, this.path)
        }
    },
    created () {
        const dir = this.parsedPath.split(Path.sep)
        this.name = this.renderChunk(dir.pop() || '')
        this.dir = this.renderChunk(dir.length ? dir.join(Path.sep) + (this.name ? Path.sep : '') : '')
    },
    methods: {
        renderChunk (string) {
            return _escape(string)
        }
    }
}
</script>
