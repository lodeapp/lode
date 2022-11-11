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
import { mapGetters } from 'vuex'
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
            rows: rows.length,
            cols: Math.max(...(rows.map(el => el.length))),
            html: ''
        }
    },
    computed: {
        ...mapGetters({
            colors: 'theme/colors'
        })
    },
    watch: {
        colors () {
            this.setHtml()
        }
    },
    async mounted () {
        this.setHtml()
    },
    methods: {
        setHtml () {
            this.loading = true
            this.html = ''

            const terminal = new Terminal({
                theme: this.colors,
                allowProposedApi: true,
                convertEol: true,
                rows: this.rows,
                cols: this.cols,
                fontFamily: 'var(--font-family-monospace)',
                fontSize: 'var(--font-size)'
            })

            setTimeout(() => {
                const serializeAddon = new SerializeAddon()
                terminal.loadAddon(serializeAddon)
                terminal.open(this.$el.querySelector('.terminal-mount'))
                terminal.write(this.processContent(this.content), () => {
                    this.html = serializeAddon.serializeAsHTML({
                        includeGlobalBackground: true
                    })

                    // @TODO: run in xterm in headless mode (i.e. don't `open`)
                    // and dispose properly instead of removing the mounted element
                    // terminal.dispose(); also remove `.terminal-mount` and
                    // related styles.
                    this.$el.querySelector('.terminal-mount').remove()
                    const mount = document.createElement('div')
                    mount.className = 'terminal-mount'
                    this.$el.append(mount)

                    this.loading = false
                })
            })
        },
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
