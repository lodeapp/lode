<template>
    <div v-if="content" class="ansi">
        <button type="button" class="btn btn-sm" title="Copy to clipboard" @click="clipboard">
            <Icon symbol="copy" />
        </button>
        <button type="button" class="btn btn-sm" title="Show raw output" @click="showRaw = !showRaw">
            <Icon symbol="code" />
        </button>
        <pre v-if="showRaw">{{ content }}</pre>
        <pre v-else v-html="html"></pre>
    </div>
</template>

<script>
import * as Convert from 'ansi-to-html'
import Icon from '@/components/Icon.vue'

export default {
    name: 'Ansi',
    components: {
        Icon
    },
    props: {
        content: {
            type: String,
            default: ''
        }
    },
    data () {
        return {
            showRaw: false,
            raw: this.content,
            // eslint-disable-next-line new-cap
            html: new Convert.default({
                fg: 'var(--color-fg-default)',
                bg: 'var(--primary-background-color)',
                newline: true,
                escapeXML: true,
                stream: false
            }).toHtml(this.processContent(this.content))
        }
    },
    methods: {
        processContent (content) {
            return content
        },
        clipboard () {
            Lode.copyToClipboard(this.showRaw ? this.content : this.$el.querySelector('pre').innerText)
        }
    }
}
</script>

<style lang="scss">
pre {
    > div {
        div,
        span {
            // Force line wrapping of terminal content
            display: inline;
            white-space: normal !important;
            word-break: break-all;
        }
    }
}
</style>
