<template>
    <div
        class="nugget"
        :class="[
            `status--${status}`,
            `is-${show ? 'expanded' : 'collapsed'}`,
            hasChildren ? 'has-children' : ''
        ]"
        tabindex="0"
        @keydown="handleKeydown"
    >
        <div class="seam"></div>
        <div class="header" @click.prevent @mousedown.prevent.stop="handleActivate">
            <div class="status" :aria-label="label" :title="label">
                <Icon v-if="status === 'error'" symbol="issue-opened" />
            </div>
            <div class="header-inner">
                <slot name="header"></slot>
            </div>
            <div v-if="hasChildren" class="toggle">
                <Icon :symbol="show ? 'chevron-down' : 'chevron-right'" />
            </div>
        </div>
        <div v-if="hasChildren && show" class="nugget-items">
            <slot></slot>
        </div>
    </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { labels } from '@lib/frameworks/status'
import HasStatus from '@/components/mixins/HasStatus'

export default {
    name: 'Nugget',
    mixins: [
        HasStatus
    ],
    props: {
        model: {
            type: Object,
            required: true
        },
        hasChildren: {
            type: Boolean,
            default: true
        },
        handler: {
            type: Function,
            default: null
        }
    },
    computed: {
        show () {
            return this.$store.getters['expand/expanded'](this.identifier)
        },
        label () {
            return labels[this.status]
        },
        ...mapGetters({
            inContext: 'context/inContext'
        })
    },
    methods: {
        handleActivate (event) {
            if (this.handler) {
                if (this.handler.call() === false) {
                    return
                }
            }
            // Don't toggle children on right-clicks.
            if (this.$input.isRightButton(event)) {
                this.$el.focus()
                return
            }
            this.toggleChildren(event)
        },
        handleKeydown (event) {
            if (event.code === 'ArrowRight' && !this.$input.isCycleForward(event)) {
                event.stopPropagation()
                this.handleExpand(event)
            } else if (event.code === 'ArrowLeft' && !this.$input.isCycleBackward(event)) {
                event.stopPropagation()
                this.handleCollapse(event)
            }
        },
        handleExpand (event) {
            if (!this.hasChildren || this.show) {
                return
            }
            this.handleActivate(event)
        },
        handleCollapse (event) {
            if (!this.hasChildren || !this.show) {
                return
            }
            this.handleActivate(event)
        },
        toggleChildren (event) {
            if (!this.hasChildren) {
                return
            }
            this.toggleExpanded()
        },
        toggleExpanded () {
            // this.$input.hasAltKey(event)
            this.$store.dispatch('expand/toggle', { id: this.identifier })
        },

        /**
         * Bubble up the `canOpen` verification between Test and Suite.
         */
        canOpen () {
            return this.$parent.canOpen()
        }
    }
}
</script>
