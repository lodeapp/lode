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
                @context-menu="onTestContextMenu"
            />
        </div>
    </div>
</template>

<script>
import { ipcRenderer } from 'electron'
import { mapGetters } from 'vuex'
import { Menu } from '@main/menu'
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
            partial: this.model.partial,
            selected: this.model.selected || false
        }
    },
    computed: {
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
            frameworkContext: 'context/frameworkContext',
            activeTest: 'context/test',
            inContext: 'context/inContext'
        })
    },
    created () {
        ipcRenderer
            .on(`${this.identifier}:framework-tests`, this.onTestsEvent)
            .on(`${this.identifier}:selective`, this.onSelectedEvent)
            .on(`${this.identifier}:selected`, this.onSelectedEvent)

        if (this.show) {
            this.expand()
        }
    },
    beforeDestroy () {
        ipcRenderer
            .removeListener(`${this.identifier}:framework-tests`, this.onTestsEvent)
            .removeListener(`${this.identifier}:selective`, this.onSelectedEvent)
            .removeListener(`${this.identifier}:selected`, this.onSelectedEvent)
    },
    methods: {
        onTestsEvent (event, payload) {
            this.$payload(payload, tests => {
                console.log('GOT TESTS', { tests })
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
            this.$emit('context-menu', this.model)
        },
        onTestContextMenu (test) {
            const originalName = test.name !== this.displayName ? test.name : false
            new Menu()
                .add({
                    label: __DARWIN__
                        ? 'Copy Test Name'
                        : 'Copy test name',
                    click: () => {
                        this.$root.copyToClipboard(test.displayName || test.name)
                    }
                })
                .addIf(originalName, {
                    label: __DARWIN__
                        ? 'Copy Original Test Name'
                        : 'Copy original test name',
                    click: () => {
                        this.$root.copyToClipboard(originalName)
                    }
                })
                .separator()
                .add({
                    label: __DARWIN__
                        ? 'Open Suite with Default Program'
                        : 'Open suite with default program',
                    click: () => {
                        this.$emit('open')
                    },
                    enabled: this.canOpen()
                })
                .open()
        },

        /**
         * Bubble up the `canOpen` verification between Test and Suite.
         */
        canOpen () {
            // @TODO: redo opening parent
            // return this.$parent.canOpen()
            return false
        }
    }
}
</script>
