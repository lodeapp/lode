<template>
    <div
        class="nugget"
        :class="[
            `status--${status}`,
            `is-${selectStatus}`,
            `is-${expandStatus}`,
            hasChildren ? 'has-children' : ''
        ]"
        tabindex="0"
        @keydown.stop.right="handleExpand"
        @keydown.stop.left="handleCollapse"
    >
        <div class="seam"></div>
        <div class="header" @click.prevent @mousedown.prevent.stop="handleActivate">
            <div class="status" :aria-label="displayStatus(status)" :title="displayStatus(status)">
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

export default {
    name: 'Nugget',
    props: {
        model: {
            type: Object,
            required: true
        },
        hasChildren: {
            type: Boolean,
            default: true
        },
        expanded: {
            type: Boolean,
            default: false
        },
        handler: {
            type: Function,
            default: null
        }
    },
    computed: {
        show () {
            return this.model.expanded
        },
        status () {
            return this.model.getStatus()
        },
        selectStatus () {
            return this.model.selected ? 'selected' : 'unselected'
        },
        expandStatus () {
            return this.show ? 'expanded' : 'collapsed'
        },
        ...mapGetters({
            displayStatus: 'status/display'
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
            this.model.toggleExpanded(!this.model.expanded, this.$input.hasAltKey(event))
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
