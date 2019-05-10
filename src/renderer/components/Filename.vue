<template>
    <span class="filename">
        <span class="dir">{{ dir }}</span>
        <span class="name">{{ name }}</span>
        <span class="extension">{{ extension }}</span>
    </span>
</template>

<script>
export default {
    name: 'Filename',
    props: {
        path: {
            type: String,
            required: true
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
