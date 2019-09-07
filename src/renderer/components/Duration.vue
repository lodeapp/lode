<template>
    <span class="duration">{{ formatted }}</span>
</template>

<script>
export default {
    name: 'Duration',
    props: {
        ms: {
            type: Number,
            default: 0
        }
    },
    computed: {
        formatted () {
            return this.$duration.format(this.ms)
        }
    }
}
</script>
