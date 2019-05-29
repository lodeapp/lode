<template>
    <span class="filename" :class="{ 'filename--truncate': truncate }">
        <template v-if="truncate">
            <span v-html="'&lrm;'"></span>{{ dir }}<strong>{{ name }}</strong>{{ extension }}
        </template>
        <template v-else>
            <span class="dir">{{ dir }}</span>
            <span class="name">{{ name }}</span>
            <span class="extension">{{ extension }}</span>
        </template>
    </span>
</template>

<script>
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
        const dir = this.path.split('/')
        this.name = dir.pop() || ''
        this.dir = dir.length ? dir.join('/') + (this.name ? '/' : '') : ''
    }
}
</script>
