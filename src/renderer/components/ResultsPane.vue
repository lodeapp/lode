<template>
    <div class="results">
        <div v-if="!test">
            No test selected.
        </div>
        <pre v-else v-html="result.feedback"></pre>
    </div>
</template>

<script>
export default {
    name: 'ResultsPane',
    props: {
        test: {
            type: Object,
            default: null
        }
    },
    computed: {
        result () {
            return this.test && this.test.result || {}
        }
    }
}
</script>
