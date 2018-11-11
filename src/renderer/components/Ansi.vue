<template>
    <div class="ansi">
        <pre v-html="raw ? content : html"></pre>
        <button type="button" title="Show raw output" @click="raw = !raw">
            <Icon symbol="code" />
        </button>
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
        terminal.write(this.content.replace(/\n/g, '\r\n') + '\r\n')
        return {
            raw: false,
            html: terminal
                .toString('html')
                .replace(/(<div style='overflow:hidden'><br \/><\/div>)*(<div style='line-height:0;visibility:hidden;'>)(&nbsp;)*<\/div>$/gm, '')
        }
    }
}
</script>

<style lang="scss">
pre div {
    // Force line wrapping of terminal content
    white-space: normal !important;
}
</style>
