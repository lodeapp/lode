<template>
    <Modal :help="help" :class="[alerts.length > 1 ? 'modal--paged' : '']" size="lg">
        <template slot="header">
            <Icon v-if="type === 'error'" class="type--error" symbol="issue-opened" />
            <h3 class="modal-title" v-html="title"></h3>
            <div class="more-actions">
                <button type="button" class="btn-link" @click.prevent="onMoreClick">
                    <Icon symbol="kebab-vertical" />
                </button>
            </div>
        </template>
        <div :key="$string.from(current)">
            <p v-markdown>{{ message }}</p>
            <Ansi v-if="error" :content="error" />
        </div>
        <div slot="footer" class="modal-footer tertiary">
            <div v-if="alerts.length > 1" class="modal-pages">
                <span class="modal-pages-current">{{ index + 1 }}</span>
                <span class="modal-pages-separator">/</span>
                <span class="modal-pages-total">{{ alerts.length }}</span>
            </div>
            <div>
                <button
                    v-if="alerts.length > 1 && index > 0"
                    type="button"
                    class="btn btn-sm"
                    @click="previous()"
                >
                    Previous
                </button>
                <button
                    v-if="alerts.length === 1 || isLast"
                    type="button"
                    class="btn btn-sm btn-primary"
                    @click="$emit('hide')"
                >
                    Close
                </button>
                <button
                    v-if="alerts.length > 1 && !isLast"
                    type="button"
                    class="btn btn-sm btn-primary"
                    @click="next"
                >
                    Next
                </button>
            </div>
        </div>
    </Modal>
</template>

<script>
import _get from 'lodash/get'
import { remote } from 'electron'
import { mapGetters } from 'vuex'
import { Logger } from '@lib/logger'
import { ProcessError } from '@lib/process/errors'
import Modal from '@/components/modals/Modal'
import Ansi from '@/components/Ansi'

export default {
    name: 'AlertStack',
    components: {
        Modal,
        Ansi
    },
    data () {
        const { Menu, MenuItem } = remote

        const menu = new Menu()
        menu.append(new MenuItem({
            label: 'Save Error Report…',
            click: () => {
                this.save(_get(this.current, 'error', null))
            }
        }))
        menu.on('menu-will-close', () => {
            this.$el.querySelector('.more-actions button').blur()
        })

        return {
            index: 0,
            menu
        }
    },
    computed: {
        current () {
            return this.alerts[this.index]
        },
        message () {
            return _get(this.current, 'message')
        },
        error () {
            return _get(this.current, 'error')
        },
        help () {
            return _get(this.current, 'help')
        },
        type () {
            return _get(this.current, 'type', 'error')
        },
        title () {
            const title = _get(this.current, 'title')
            if (title) {
                return title
            }
            switch (this.type) {
                case 'error':
                    return 'Error'
                default:
                    return 'Alert'
            }
        },
        isLast () {
            return this.index === (this.alerts.length - 1)
        },
        ...mapGetters({
            alerts: 'alert/alerts'
        })
    },
    methods: {
        next () {
            this.index++
        },
        previous () {
            this.index--
        },
        onMoreClick (event) {
            event.preventDefault()
            const { x, y, height } = this.$el.querySelector('.more-actions button').getBoundingClientRect()
            this.menu.popup({
                window: remote.getCurrentWindow(),
                x: Math.ceil(x),
                y: Math.ceil(y + height + 6)
            })
        },
        async save (error) {
            const directory = remote.dialog.showOpenDialog({
                properties: ['openDirectory'],
                message: 'Select directory to save the file',
                buttonLabel: 'Save Error Report'
            })

            if (!directory) {
                return
            }

            Logger.debug
                .withError(error)
                .withProcess(error instanceof ProcessError ? error.process : null)
                .save(directory[0])
        }
    }
}
</script>
