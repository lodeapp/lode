<template>
    <Nugget
        :model="test"
        class="test"
        :class="{ 'is-active': isActive, 'is-child-active': isChildActive }"
        :has-children="hasChildren"
        :handler="onClick"
        @contextmenu.native.stop.prevent="onContextMenu"
    >
        <template slot="header">
            <div v-if="selectable" class="selective-toggle" :class="{ disabled: running }" @mousedown.stop="selected = !selected">
                <button type="button" :disabled="running"></button>
                <input
                    type="checkbox"
                    v-model="selected"
                    :disabled="running"
                    @click.prevent
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
            return this.breadcrumbs.indexOf(this.test.getId()) > -1
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
            return this.test.getId() === this.testActive
        },
        ...mapGetters({
            testActive: 'test/active',
            breadcrumbs: 'breadcrumbs/active'
        })
    },
    methods: {
        onClick () {
            if (!this.hasChildren && !this.isActive) {
                this.activate()
                return false
            }
        },
        onChildActivation () {
            this.$root.breadcrumb(this.test)
            this.$emit('activate')
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
            this.$store.commit('test/SET', this.test.getId())
            this.$root.resetActiveTest()
            this.$nextTick(() => {
                this.$emit('activate')
                this.$root.setActiveTest(this.test)
            })
        }
    }
}
</script>
