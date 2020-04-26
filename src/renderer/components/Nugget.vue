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
                        :checked="selected || selective > 0"
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
                v-for="child in children"
                class="test"
                :key="child.id"
                :model="child"
                :running="running"
                :selectable="canToggleTests"
                :has-children="child.testsLoaded !== false && (child.tests || []).length > 0"
                :children="child.tests"
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
import HasToggle from '@/components/mixins/HasToggle'

export default {
    name: 'Nugget',
    mixins: [
        HasStatus,
        HasToggle
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
        children: {
            type: Array,
            default () {
                return []
            }
        },
        handler: {
            type: Function,
            default: null
        },
        running: {
            type: Boolean,
            default: false
        }
    },
    data () {
        return {
            nugget: this.model
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
            activeTest: 'context/test',
            inContext: 'context/inContext'
        })
    },
    created () {
        if (this.hasChildren) {
            this.nugget.tests.forEach(test => {
                ipcRenderer.on(`${test.id}:status`, this.childStatusListener)
            })
        }
    },
    destroyed () {
        if (this.hasChildren) {
            this.nugget.tests.forEach(test => {
                ipcRenderer.removeListener(`${test.id}:status`, this.childStatusListener)
            })
        }
    },
    methods: {
        childStatusListener (event, to, from, id) {
            this.nugget.tests.map(test => {
                if (test.id === id) {
                    test.status = to
                }
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
            if (!this.hasChildren && !this.isActive) {
                this.activate()
                return false
            }
        },
        activate () {
            this.$el.focus()
            this.$store.commit('context/TEST', this.identifier)
            // @TODO: redo set active
            // this.test.setActive(true)
            setTimeout(() => {
                this.$emit('activate', [this.model])
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
            this.$store.dispatch('expand/toggle', this.identifier)
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
        },
        onChildActivation (context) {
            context.unshift(this.model)
            this.$store.commit('context/ADD', this.identifier)
            this.$nextTick(() => {
                this.$emit('activate', context)
            })
        }
    }
}
</script>
