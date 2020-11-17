<template>
    <div v-if="content" class="ansi">
        <button type="button" title="Copy to clipboard" @click="clipboard">
            <Icon symbol="clippy" />
        </button>
        <button type="button" title="Show raw output" @click="showRaw = !showRaw">
            <Icon symbol="code" />
        </button>
        <pre v-if="showRaw">{{ content }}</pre>
        <pre v-else v-html="html"></pre>
    </div>
</template>

<script>
import Terminal from 'terminal.js'
import Icon from '@/components/Icon'

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
        // Create a new Terminal instance with plenty of space for our output.
        // We'll trim the unsused space when rendering the html.
        const terminal = new Terminal({ columns: 20000, rows: 20000 })
        terminal.write(this.processContent(this.content))
        return {
            showRaw: false,
            raw: this.content,
            html: terminal
                .toString('html')
                .replace(/(<div style='overflow:hidden'><br \/><\/div>)*(<div style='line-height:0;visibility:hidden;'>)(&nbsp;)*<\/div>$/gm, '')
        }
    },
    methods: {
        processContent (content) {
            [
                [/\n/g, '\r\n'],
                [/<<<REPORT\{?\s*/, ''],
                [/Connection to .+ closed\.\s*$/, ''],
                [/PHPUnit .+ by Sebastian Bergmann and contributors\.\s+/, ''],
                [/\x1b]8;;.*\x1b]8;;/g, '']
            ].forEach(replace => {
                content = content.replace(replace[0], replace[1])
            })

            return content + '\r\n'
        },
        clipboard () {
            Lode.copyToClipboard(this.showRaw ? this.content : this.$el.querySelector('pre').innerText)
        }
    }
}
</script>

<style lang="scss">
pre {

    & > div {

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
