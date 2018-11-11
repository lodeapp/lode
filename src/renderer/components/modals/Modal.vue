<template>
    <div class="modal" :class="{ 'is-last': isLast }" tabindex="-1" role="dialog" @click.self="handleClick">
        <div class="modal-dialog" :class="[sizeClass]">
            <div class="modal-content">
                <div class="modal-header">
                    <slot name="header">
                        <h3 class="modal-title" v-html="title"></h3>
                    </slot>
                    <button type="button" class="close" aria-label="::.Close.::" @click="$modal.close()" v-if="dismissable">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>

                <div class="modal-body">
                    <slot>
                        <div v-if="body" v-html="body"></div>
                    </slot>
                </div>

                <slot name="troubleshoot">
                    <div v-if="troubleshoot" class="modal-troubleshoot">
                        <Icon symbol="info" />
                        <div v-markdown>{{ troubleshoot }}</div>
                    </div>
                </slot>

                <slot name="footer">
                    <div v-if="footer" v-html="footer" class="modal-footer tertiary"></div>
                </slot>
            </div>
        </div>
    </div>
</template>

<script>
import _first from 'lodash/first'

export default {
    name: 'Modal',
    props: {
        isLast: {
            type: Boolean,
            default: false
        },
        dismissable: {
            type: Boolean,
            default: true
        },
        title: {
            type: String,
            default: ''
        },
        body: {
            type: String,
            default: ''
        },
        footer: {
            type: String,
            default: ''
        },
        troubleshoot: {
            type: String,
            default: ''
        },
        size: {
            type: String,
            default: 'md'
        }
    },
    data () {
        return {
            escapeHandler: null
        }
    },
    computed: {
        sizeClass () {
            if (this.size === 'md') {
                return null
            }
            return `modal-${this.size}`
        }
    },
    mounted () {
        if (this.dismissable) {
            this.escapeHandler = (e) => {
                if (this.$input.isEscapeKey(e)) {
                    this.close()
                }
            }
            document.addEventListener('keydown', this.escapeHandler)
        }
        const inputs = this.$el.getElementsByTagName('input')
        if (inputs.length) {
            _first(inputs).focus()
        }
    },
    destroyed () {
        document.removeEventListener('keydown', this.escapeHandler)
    },
    methods: {
        close () {
            if (this.$parent && typeof this.$parent.reject === 'function') {
                this.$parent.reject()
            }
            this.$modal.close()
        },
        handleClick () {
            if (this.dismissable) {
                this.close()
            }
        }
    }
}
</script>

<style scoped>
.is-last {
    z-index: 1050;
}
</style>
