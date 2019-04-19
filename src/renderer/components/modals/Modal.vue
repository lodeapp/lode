<template>
    <div class="modal" :class="{ 'is-last': isLast }" tabindex="-1" role="dialog" @click.self="handleClick">
        <div class="modal-dialog" :class="[sizeClass]">
            <div class="modal-content">
                <div class="modal-header">
                    <slot name="header">
                        <h3 v-if="title" v-html="title" class="modal-title"></h3>
                    </slot>
                    <button type="button" class="close" aria-label="Close" @click="$modal.close()">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>

                <div class="modal-body">
                    <slot>
                        <div v-if="body" v-html="body"></div>
                    </slot>
                </div>

                <slot name="help">
                    <div v-if="help" class="modal-help">
                        <Icon symbol="info" />
                        <div v-markdown>{{ help }}</div>
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
export default {
    name: 'Modal',
    props: {
        isLast: {
            type: Boolean,
            default: false
        },
        dismissable: {
            type: Boolean,
            default: false
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
        help: {
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
        this.escapeHandler = (e) => {
            if (this.$input.isEscapeKey(e)) {
                this.close()
            }
        }
        document.addEventListener('keydown', this.escapeHandler)

        const selectors = ['.autofocus', 'input, select']
        selectors.some(selector => {
            const elements = this.$el.querySelectorAll(selector)
            if (elements.length) {
                elements[0].focus()
                return true
            }
        })
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
