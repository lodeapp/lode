<template>
    <i class="octicon" v-html="svg"></i>
</template>

<script>
export default {
    name: 'Icon',
    props: {
        i: {
            type: String,
            required: true
        }
    },
    computed: {
        svg () {
            return this.$icon[this.i].toSVG()
        }
    }
}
</script>
