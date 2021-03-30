<template>
    <Modal :help="help" :class="[alerts.length > 1 ? 'modal--paged' : '']">
        <template #header>
            <Icon v-if="type === 'error'" class="type--error" symbol="issue-opened" />
            <h3 class="modal-title" v-html="title"></h3>
            <button type="button" class="close" aria-label="Close" @click="close">
                <span aria-hidden="true">&times;</span>
            </button>
        </template>
        <div :key="$string.from(current)">
            <p v-markdown>{{ message }}</p>
            <Ansi v-if="error" :content="error" />
        </div>
        <template #footer>
            <div class="modal-footer tertiary">
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
                        class="btn btn-sm btn-primary autofocus"
                        @click="close"
                    >
                        Close
                    </button>
                    <button
                        v-if="alerts.length > 1 && !isLast"
                        type="button"
                        class="btn btn-sm btn-primary autofocus"
                        @click="next"
                    >
                        Next
                    </button>
                </div>
            </div>
        </template>
    </Modal>
</template>

<script>
import _get from 'lodash/get'
import { mapGetters } from 'vuex'
import Ansi from '@/components/Ansi'
import Modal from '@/components/modals/mixins/modal'

export default {
    name: 'AlertStack',
    components: {
        Ansi
    },
    mixins: [Modal],
    data () {
        return {
            index: 0
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
        }
    }
}
</script>
