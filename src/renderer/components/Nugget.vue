<template>
    <div
        class="nugget"
        :class="[
            `status--${status}`,
            `is-${show ? 'expanded' : 'collapsed'}`,
            model.hasChildren ? 'has-children' : '',
            isChildActive ? 'is-child-active' : ''
        ]"
        tabindex="0"
        @keydown="handleKeydown"
        @keydown.self.stop.prevent.space="onSelect"
        @contextmenu.stop.prevent="onContextMenu"
    >
        <div class="seam"></div>
        <div class="header" @click.prevent @mousedown.prevent.stop="handleActivate">
            <div class="status" :aria-label="label" :title="label">
                <Icon v-if="status === 'error'" symbol="issue-opened" />
            </div>
            <div class="header-inner">
                <div v-if="selectable" class="selective-toggle" :class="{ disabled: running }" @mousedown.prevent.stop="onSelect">
                    <button tabindex="-1" type="button" :disabled="running"></button>
                    <input
                        type="checkbox"
                        tabindex="-1"
                        :checked="selected"
                        :indeterminate.prop="partial"
                        :disabled="running"
                        @click.prevent
                        @mousedown.prevent
                        @mousedown.stop="onSelect"
                    >
                </div>
                <slot>
                    <div class="test-name" :title="displayName">{{ displayName }}</div>
                </slot>
            </div>
            <div v-if="model.hasChildren" class="toggle">
                <Icon :symbol="show ? 'chevron-down' : 'chevron-right'" />
            </div>
        </div>
        <div v-if="model.hasChildren && show" class="nugget-items">
            <Nugget
                v-for="test in tests"
                class="test"
                :key="$string.from(test)"
                :model="test"
                :running="running"
                :selectable="canToggleTests"
                @toggle="onChildToggle"
                @select="onChildSelect"
                @activate="onChildActivation"
                @context-menu="onChildContextMenu"
            />
        </div>
    </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { labels } from '@lib/frameworks/status'

export default {
    name: 'Nugget',
    props: {
        model: {
            type: Object,
            required: true
        },
        handler: {
            type: Function,
            default: null
        },
        running: {
            type: Boolean,
            default: false
        },
        selectable: {
            type: Boolean,
            default: false
        }
    },
    data () {
        return {
            tests: [],
            status: this.model.status || 'idle',
            partial: this.model.partial,
            selected: this.model.selected || false
        }
    },
    computed: {
        identifier () {
            return this.model.id || this.model.file
        },
        show () {
            return this.$store.getters['expand/expanded'](this.identifier)
        },
        label () {
            return labels[this.status]
        },
        isChildActive () {
            return this.inContext(this.identifier)
        },
        canToggleTests () {
            return this.$parent.canToggleTests
        },
        displayName () {
            return this.model.displayName || this.model.name
        },
        isActive () {
            if (this.identifier === this.activeTest) {
                return true
            }
            this.deactivate()
            return false
        },
        ...mapGetters({
            activeTest: 'context/test',
            inContext: 'context/inContext'
        })
    },
    created () {
        Lode.ipc
            .on(`${this.identifier}:status:list`, this.statusListener)
            .on(`${this.identifier}:children`, this.onChildrenEvent)
            .on(`${this.identifier}:framework-tests`, this.onTestsEvent)
            .on(`${this.identifier}:selective`, this.onSelectedEvent)
            .on(`${this.identifier}:selected`, this.onSelectedEvent)

        if (this.show) {
            this.expand()
        }
    },
    beforeDestroy () {
        Lode.ipc
            .removeAllListeners(`${this.identifier}:status:list`)
            .removeAllListeners(`${this.identifier}:framework-tests`)
            .removeAllListeners(`${this.identifier}:selective`)
            .removeAllListeners(`${this.identifier}:selected`)
    },
    methods: {
        statusListener (event, payload) {
            this.$payload(payload, (to, from) => {
                this.status = to
                this.$emit('status', to, from, this.model)
            })
        },
        onChildrenEvent (event, payload) {
            this.$payload(payload, hasChildren => {
                this.model.hasChildren = hasChildren
            })
        },
        onTestsEvent (event, payload) {
            this.$payload(payload, tests => {
                this.tests = tests
            })
        },
        onSelectedEvent (event, payload) {
            this.$payload(payload, nugget => {
                this.selected = nugget.selected
                this.partial = nugget.selected && nugget.partial
            })
        },
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
        onActivate () {
            if (!this.model.hasChildren && !this.isActive) {
                this.activate()
                return false
            }
        },
        activate () {
            this.$el.focus()
            this.$store.commit('context/ADD', this.identifier)
            // @TODO: redo set active
            // this.test.setActive(true)
            setTimeout(() => {
                this.$emit('activate', [this.identifier])
            })
        },
        deactivate () {
            // @TODO: redo set active
            // this.test.setActive(false)
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
            if (!this.model.hasChildren || this.show) {
                return
            }
            this.handleActivate(event)
        },
        handleCollapse (event) {
            if (!this.model.hasChildren || !this.show) {
                return
            }
            this.handleActivate(event)
        },
        toggleChildren (event) {
            if (!this.model.hasChildren) {
                return
            }
            if (this.show) {
                this.$store.dispatch('expand/collapse', this.identifier)
                this.collapse()
                return
            }
            this.$store.dispatch('expand/expand', this.identifier)
            this.expand()
        },
        expand () {
            this.$emit('toggle', [this.identifier], true)
        },
        collapse () {
            // Before hiding a nugget, make sure to reset its children's expand state.
            (this.tests || []).forEach(test => {
                this.$store.dispatch('expand/collapse', test.id)
            })
            this.$emit('toggle', [this.identifier], false)
        },
        onChildToggle (context, toggle) {
            context.unshift(this.identifier)
            this.$emit('toggle', context, toggle)
        },
        onChildActivation (context) {
            context.unshift(this.identifier)
            this.$store.commit('context/ADD', this.identifier)
            this.$nextTick(() => {
                this.$emit('activate', context)
            })
        },
        onSelect (event) {
            if (this.running) {
                return
            }
            this.selected = !this.selected
            this.$emit('select', [this.identifier], this.selected)
        },
        onChildSelect (context, selected) {
            context.unshift(this.identifier)
            this.$emit('select', context, selected)
        },
        onContextMenu () {
            this.$emit('context-menu', [this.identifier])
        },
        onChildContextMenu (context, test) {
            context.unshift(this.identifier)
            this.$emit('context-menu', context, test)
        }
    }
}
</script>
