<template>
    <Nugget
        :model="test"
        class="test"
        :class="{
            'is-active': isActive,
            'is-child-active': isChildActive,
            'has-context': hasContext,
            'child-has-context': childHasContext
        }"
        :has-children="hasChildren"
        :handler="onClick"
        @contextmenu.native.stop.prevent="onContextMenu"
    >
        <template slot="header">
            <div v-if="selectable" class="selective-toggle" :class="{ disabled: running }" @click.stop="selected = true">
                <button type="button" :disabled="running"></button>
                <input type="checkbox" v-model="selected" :disabled="running">
            </div>
            <div class="test-name" :title="displayName">{{ displayName }}</div>
        </template>
        <template v-if="hasChildren">
            <Test
                v-for="test in test.tests"
                :key="test.id"
                :model="test"
                :running="running"
                :selectable="selectable"
                @open="$emit('open')"
                @activate="onChildActivation"
                @deactivate="onChildDeactivation"
                @add-context="onChildAddContext"
                @remove-context="onChildRemoveContext"
            />
        </template>
    </Nugget>
</template>

<script>
import { Menu } from '@main/menu'
import Nugget from '@/components/Nugget'
import Breadcrumb from '@/components/mixins/breadcrumb'
import Context from '@/components/mixins/context'

export default {
    name: 'Test',
    components: {
        Nugget
    },
    mixins: [
        Breadcrumb,
        Context
    ],
    props: {
        model: {
            type: Object,
            required: true
        },
        selectable: {
            type: Boolean,
            default: false
        },
        running: {
            type: Boolean,
            default: false
        }
    },
    data () {
        return {
            show: false
        }
    },
    computed: {
        test () {
            return this.model
        },
        hasChildren () {
            return this.test.tests && this.test.tests.length > 0
        },
        selected: {
            get () {
                return this.test.selected
            },
            set (checked) {
                this.test.toggleSelected(checked)
            }
        },
        displayName () {
            return this.test.getDisplayName()
        },
        originalName () {
            return this.test.getName() !== this.displayName ? this.test.getName() : false
        },
        isActive () {
            return this.test.isActive || false
        }
    },
    watch: {
        '$root.active.test' (active) {
            if (this.isActive && active.id !== this.test.id) {
                this.deactivate()
            }
        }
    },
    methods: {
        onClick () {
            if (!this.hasChildren && !this.isActive) {
                this.activate()
                return false
            }
        },
        onContextMenu (event) {
            new Menu()
                .before(() => {
                    this.onAddContext()
                })
                .add({
                    label: __DARWIN__
                        ? 'Copy Test Name'
                        : 'Copy test name',
                    click: () => {
                        this.$root.copyToClipboard(this.displayName)
                    }
                })
                .addIf(this.originalName, {
                    label: __DARWIN__
                        ? 'Copy Original Test Name'
                        : 'Copy original test name',
                    click: () => {
                        this.$root.copyToClipboard(this.originalName)
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
                .after(() => {
                    this.onRemoveContext()
                })
                .open()
        },
        canOpen () {
            return this.$parent.canOpen()
        },
        activate () {
            this.$root.setActiveTest(this.test)
            this.$nextTick(() => {
                this.test.activate()
                this.$emit('activate')
            })
        },
        deactivate () {
            this.test.deactivate()
            this.$emit('deactivate')
        },
        refresh () {
            this.activate()
        }
    }
}
</script>
