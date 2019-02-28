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
                :model="test"
                :running="running"
                :selectable="selectable"
                @open="$emit('open')"
                @activate="onChildActivation"
                @deactivate="onChildDeactivation"
            />
        </template>
    </Nugget>
</template>

<script>
import { mapGetters } from 'vuex'
import { Menu } from '@main/menu'
import Nugget from '@/components/Nugget'
import Breadcrumb from '@/components/mixins/breadcrumb'

export default {
    name: 'Test',
    components: {
        Nugget
    },
    mixins: [
        Breadcrumb
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
            if (this.test.getId() === this.testActive) {
                return true
            }
            this.deactivate()
            return false
        },
        ...mapGetters({
            testActive: 'test/active'
        })
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
            this.$nextTick(() => {
                this.$emit('activate')
                this.$root.setActiveTest(this.test)
            })
        },
        deactivate () {
            this.$emit('deactivate')
        }
    }
}
</script>
