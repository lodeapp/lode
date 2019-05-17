<template>
    <div class="snippet">
        <pre><code :class="['hljs', activeLanguage]" v-html="snippet"></code></pre>
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
        parsed () {
            return this.$code.highlight(this.code, this.language)
        },
        activeLanguage () {
            return this.parsed.language
        },
        snippet () {
            return this.line
                ? this.$code.lines(this.parsed.value, Object.keys(this.code)[0] || 1, this.line)
                : this.parsed.value
        }
    }
}
</script>
