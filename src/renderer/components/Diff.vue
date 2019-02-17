<template>
    <div class="diff">
        <pre><code>{{ parsed }}</code></pre>
    </div>
</template>

<script>
export default {
    name: 'Diff',
    props: {
        diff: {
            type: String,
            required: true
        }
    },
    computed: {
        parsed () {
            return this.diff
                .replace(/^\n/, '')
        }
    },
    mounted () {
        this.$highlight.block(this.$el.querySelector('pre code'))
    }
}
</script>
