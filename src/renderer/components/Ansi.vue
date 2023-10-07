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
    </div>
</template>

<script>
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
                terminal.write(this.content, () => {
                    this.html = serializeAddon.serializeAsHTML({
                        includeGlobalBackground: true
                    })
                    this.loading = false
                })
            })
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
