<template>
    <Nugget
        :model="test"
        class="test"
        :class="{ 'is-active': isActive, 'is-child-active': isChildActive }"
        :has-children="hasChildren"
        :handler="onActivate"
        @focus.native="onActivate"
        @contextmenu.native.stop.prevent="onContextMenu"
        @keydown.native.self.stop.prevent.space="onSelectiveClick"
    >
        <template slot="header">
            <div v-if="selectable" class="selective-toggle" :class="{ disabled: running }" @mousedown.prevent.stop="onSelectiveClick">
                <button tabindex="-1" type="button" :disabled="running"></button>
                <input
                    type="checkbox"
                    tabindex="-1"
                    v-model="selected"
                    :disabled="running"
                    @click.prevent
                    @mousedown.prevent
                    @mousedown.stop="selected = !selected"
                >
            </div>
            <div class="test-name" :title="displayName">{{ displayName }}</div>
        </template>
        <template v-if="hasChildren">
            <Test
                v-for="test in test.tests"
                :key="test.getId()"
                :test="test"
                :running="running"
                :selectable="selectable"
                @open="$emit('open')"
                @activate="onChildActivation"
            />
        </template>
    </Nugget>
</template>

<script>
import { mapGetters } from 'vuex'
import { Menu } from '@main/menu'
import Nugget from '@/components/Nugget'

export default {
    name: 'Test',
    components: {
        Nugget
    },
    props: {
        test: {
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
    computed: {
        hasChildren () {
            return this.test.hasChildren()
        },
        isChildActive () {
            return this.context.indexOf(this.test.getId()) > -1
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
            if (this.test.getId() === this.testActive) {
                return true
            }
            this.deactivate()
            return false
        },
        ...mapGetters({
            testActive: 'test/active',
            context: 'context/active'
        })
    },
    methods: {
        onActivate () {
            if (!this.hasChildren && !this.isActive) {
                this.activate()
                return false
            }
        },
        onSelectiveClick (event) {
            if (this.running) {
                return
            }
            this.selected = !this.selected
        },
        onContextMenu (event) {
            new Menu()
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
                .open()
        },
        canOpen () {
            return this.$parent.canOpen()
        },
        activate () {
            this.$el.focus()
            this.$store.commit('test/SET', this.test.getId())
            this.$store.commit('context/CLEAR')
            this.test.setActive(true)
            setTimeout(() => {
                this.$emit('activate', [this.test])
            })
        },
        deactivate () {
            this.test.setActive(false)
        },
        onChildActivation (context) {
            context.unshift(this.test)
            this.$store.commit('context/ADD', this.test.getId())
            this.$nextTick(() => {
                this.$emit('activate', context)
            })
        }
    }
}
</script>
