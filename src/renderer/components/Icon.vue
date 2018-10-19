<template>
    <i class="octicon" v-html="svg"></i>
</template>

<script>
export default {
    name: 'Icon',
    props: {
        slug: {
            type: String,
            required: true
        }
    },
    computed: {
        svg () {
            return this.$icon[this.slug].toSVG()
        }
    }
}
</script>
