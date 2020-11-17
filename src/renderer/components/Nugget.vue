<template>
    <div
        class="nugget"
        :class="[
            `status--${status}`,
            `is-${show ? 'expanded' : 'collapsed'}`,
            hasChildren ? 'has-children' : '',
            isChildActive ? 'is-child-active' : ''
        ]"
        tabindex="0"
        @keydown="handleKeydown"
        @keydown.self.stop.prevent.space="onSelect"
        @contextmenu.stop.prevent="onContextMenu"
    >
        <div class="seam"></div>
        <div class="header" @click.prevent @mousedown.prevent.stop="handleToggle">
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
            <div v-if="hasChildren" class="toggle">
                <Icon :symbol="show ? 'chevron-down' : 'chevron-right'" />
            </div>
        </div>
        <div v-if="hasChildren && show" class="nugget-items">
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
import _fromPairs from 'lodash/fromPairs'
import { labels } from '@lib/frameworks/status'

export default {
    name: 'Nugget',
    props: {
        model: {
            type: Object,
            required: true
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
            partial: this.model.partial,
            selected: this.model.selected || false,
            hasChildren: this.model.hasChildren
        }
    },
    computed: {
        identifier () {
            return this.model.id || this.model.file
        },
        show () {
            return this.$store.getters['expand/expanded'](this.identifier)
        },
        status () {
            return this.getStatus(this.identifier)
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
            return this.identifier === this.activeTest
        },
        ...mapGetters({
            activeTest: 'context/test',
            inContext: 'context/inContext',
            getStatus: 'status/nugget'
        })
    },
    watch: {
        status (to, from) {
            this.$emit('status', to, from, this.model.file, this.selected)
        }
    },
    mounted () {
        Lode.ipc
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
            .removeAllListeners(`${this.identifier}:children`)
            .removeAllListeners(`${this.identifier}:framework-tests`)
            .removeAllListeners(`${this.identifier}:selective`)
            .removeAllListeners(`${this.identifier}:selected`)
    },
    methods: {
        onChildrenEvent (event, hasChildren) {
            this.hasChildren = hasChildren
        },
        onTestsEvent (event, tests) {
            this.$store.commit('status/UPDATE', _fromPairs(tests.map(test => [test.id, test.status])))
            this.tests = tests
        },
        onSelectedEvent (event, nugget) {
            this.selected = nugget.selected
            this.partial = nugget.selected && nugget.partial
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
        handleToggle (event) {
            // If it's a test with no children, handle activation instead of toggle.
            if (!this.model.file && !this.hasChildren) {
                this.handleActivate()
                return
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
            this.handleToggle(event)
        },
        handleCollapse (event) {
            if (!this.hasChildren || !this.show) {
                return
            }
            this.handleToggle(event)
        },
        toggleChildren (event) {
            if (!this.hasChildren) {
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
        handleActivate () {
            if (!this.isActive) {
                this.activate()
            }
        },
        activate () {
            this.$el.focus()
            this.$store.commit('context/CLEAR_NUGGETS')
            this.$emit('activate', [this.identifier])
        },
        onChildActivation (context) {
            context.unshift(this.identifier)
            this.$emit('activate', context)
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
