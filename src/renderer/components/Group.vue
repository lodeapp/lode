<template>
    <div
        class="group"
        :class="[
            `status--${status}`,
            `is-${selectStatus}`,
            `is-${expandStatus}`,
            hasChildren ? 'has-children' : ''
        ]"
        @click.stop="onClick"
    >
        <div class="seam"></div>
        <div class="header">
            <div class="status" :aria-label="displayStatus(status)" :title="displayStatus(status)"></div>
            <div class="header-inner">
                <slot name="header"></slot>
            </div>
            <div v-if="hasChildren" class="toggle">
                <Icon :symbol="show ? 'chevron-down' : 'chevron-right'" />
            </div>
        </div>
        <div v-if="hasChildren && show" class="group-items">
            <slot></slot>
        </div>
    </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
    name: 'Group',
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
    data () {
        return {
            show: this.expanded
        }
    },
    computed: {
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
        onClick () {
            if (this.handler) {
                if (this.handler.call() === false) {
                    return
                }
            }
            this.toggleChildren()
        },
        toggleChildren () {
            if (!this.hasChildren) {
                return
            }
            this.show = !this.show
        }
    }
}
</script>
