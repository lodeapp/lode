<template>
    <div class="snippet">
        <pre><code :class="[language]">{{ parsed }}</code></pre>
    </div>
</template>

<script>
export default {
    name: 'Snippet',
    props: {
        snippet: {
            type: [String, Object],
            required: true
        },
        language: {
            type: String,
            default: ''
        },
        line: {
            type: [String, Number],
            default: null
        }
    },
    computed: {
        isObject () {
            return typeof this.snippet === 'object'
        },
        parsed () {
            if (!this.isObject) {
                return this.$highlight.normalize(this.snippet)
            }

            return this.$highlight.normalize([].concat(
                this.snippet.pre,
                this.snippet.highlight,
                this.snippet.post
            ).join('\n'))
        }
    },
    mounted () {
        const code = this.$highlight.element(this.$el.querySelector('pre code'))

        if (this.line) {
            code.lines(this.line - this.snippet.pre.length, this.line)
        }
    }
}
</script>
