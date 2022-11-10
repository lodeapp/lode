<template>
    <div v-if="content" class="ansi" :class="{ 'is-loading': loading }">
        <button type="button" class="btn btn-sm" title="Copy to clipboard" @click="clipboard">
            <Icon symbol="copy" />
        </button>
        <button type="button" class="btn btn-sm" title="Show raw output" @click="showRaw = !showRaw">
            <Icon symbol="code" />
        </button>
        <div v-if="loading" class="loading">
            <div class="loading-group">
                <div class="spinner"></div>
            </div>
        </div>
        <div v-else>
            <pre v-if="showRaw">{{ content }}</pre>
            <div v-else v-html="html" class="parsed"></div>
        </div>
        <div class="terminal-mount"></div>
    </div>
</template>

<script>
import { escape } from 'lodash'
import { Terminal } from 'xterm'
import { SerializeAddon } from 'xterm-addon-serialize'
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
        const rows = this.content.split(/\r\n|\r|\n/)
        return {
            loading: true,
            showRaw: false,
            terminal: new Terminal({
                theme: {
                    foreground: 'var(--color-xterm-foreground)',
                    background: 'var(--color-xterm-background)',
                    cursor: 'var(--color-xterm-cursor)',
                    black: 'var(--color-xterm-black)',
                    brightBlack: 'var(--color-xterm-brightBlack)',
                    red: 'var(--color-xterm-red)',
                    brightRed: 'var(--color-xterm-brightRed)',
                    green: 'var(--color-xterm-green)',
                    brightGreen: 'var(--color-xterm-brightGreen)',
                    yellow: 'var(--color-xterm-yellow)',
                    brightYellow: 'var(--color-xterm-brightYellow)',
                    blue: 'var(--color-xterm-blue)',
                    brightBlue: 'var(--color-xterm-brightBlue)',
                    magenta: 'var(--color-xterm-magenta)',
                    brightMagenta: 'var(--color-xterm-brightMagenta)',
                    cyan: 'var(--color-xterm-cyan)',
                    brightCyan: 'var(--color-xterm-brightCyan)',
                    white: 'var(--color-xterm-white)',
                    brightWhite: 'var(--color-xterm-brightWhite)'
                },
                allowProposedApi: true,
                convertEol: true,
                rows: rows.length,
                cols: Math.max(...(rows.map(el => el.length))),
                fontFamily: 'var(--font-family-monospace)',
                fontSize: 'var(--font-size)'
            }),
            html: ''
        }
    },
    async mounted () {
        setTimeout(() => {
            const serializeAddon = new SerializeAddon()
            this.terminal.loadAddon(serializeAddon)
            this.terminal.open(this.$el.querySelector('.terminal-mount'))
            this.terminal.write(this.processContent(this.content), () => {
                this.html = serializeAddon.serializeAsHTML({
                    includeGlobalBackground: true
                })
                this.$el.querySelector('.terminal-mount').remove()
                // @TODO: run in xterm in headless mode (i.e. don't `open`)
                // and dispose properly instead of removing the mounted element
                // this.terminal.dispose(); also remove `.terminal-mount` and
                // related styles.
                this.loading = false
            })
        })
    },
    methods: {
        processContent (content) {
            return escape(content)
        },
        clipboard () {
            Lode.copyToClipboard(
                this.showRaw
                    ? this.content
                    : this.$el.querySelector('.parsed').innerText
            )
        }
    }
}
</script>
