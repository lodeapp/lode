<template>
    <div class="snippet">
        <button v-if="copy" type="button" title="Copy to clipboard" @click="clipboard">
            <Icon symbol="clippy" />
        </button>
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
        },
        copy: {
            type: String,
            default: ''
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
    },
    methods: {
        clipboard () {
            this.$root.copyToClipboard(this.copy)
        }
    }
}
</script>
