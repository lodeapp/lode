<template>
    <div class="snippet">
        <pre><code :class="[language]">{{ parsed }}</code></pre>
    </div>
</template>

<script>
export default {
    name: 'Snippet',
    props: {
        code: {
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
            return typeof this.code === 'object'
        },
        parsed () {
            if (!this.isObject) {
                return this.$highlight.normalize(this.code)
            }

            return this.$highlight.normalize(Object.values(this.code).join('\n'))
        }
    },
    mounted () {
        const code = this.$highlight.element(this.$el.querySelector('pre code'))

        if (this.line) {
            code.lines(Object.keys(this.code)[0] || 1, this.line)
        }
    }
}
</script>
