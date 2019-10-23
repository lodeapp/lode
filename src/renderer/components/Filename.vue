<template>
    <span class="filename" :class="{ 'filename--truncate': truncate }">
        <template v-if="truncate">
            <span v-html="'&lrm;'"></span>{{ dir }}<strong>{{ name }}</strong>{{ extension }}
        </template>
        <template v-else>
            <span class="dir" v-html="dir"></span>
            <span class="name" v-html="name"></span>
            <span class="extension" v-html="extension"></span>
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
        truncate: {
            type: Boolean,
            default: false
        }
    },
    data () {
        return {
            dir: '',
            name: '',
            extension: ''
        }
    },
    created () {
        const dir = this.path.split(Path.sep)
        this.name = this.renderChunk(dir.pop() || '')
        this.dir = this.renderChunk(dir.length ? dir.join(Path.sep) + (this.name ? Path.sep : '') : '')
    },
    methods: {
        renderChunk (string) {
            // Since markdown transformations don't work well with punctuation
            // characters, we need to roll our own highlighting delimiters.
            // Note that this doesn't work for truncated strings, but we
            // should never highlight those, either.
            return _escape(string)
                .replace(/\[==\]/g, '<mark>')
                .replace(/\[\!==\]/g, '</mark>')
        }
    }
}
</script>
