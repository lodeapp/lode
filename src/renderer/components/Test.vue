<template>
    <Group
        :model="test"
        class="test"
        :class="{ 'is-active': isActive, 'is-child-active': isChildActive }"
        :has-children="hasChildren"
        :handler="onClick"
    >
        <template slot="header">
            <div v-if="selectable" class="input--select">
                <input type="checkbox" v-model="selected" @click.stop>
            </div>
            <div class="test-name" :title="test.displayName">{{ test.displayName }}</div>
        </template>
        <template v-if="hasChildren">
            <Test
                v-for="test in test.tests"
                :key="test.id"
                :test="test"
                :selectable="selectable"
                @activate="onChildActivation"
                @deactivate="onChildDeactivation"
            />
        </template>
    </Group>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import Group from '@/components/Group'

export default {
    name: 'Test',
    components: {
        Group
    },
    props: {
        test: {
            type: Object,
            required: true
        },
        selectable: {
            type: Boolean,
            default: false
        }
    },
    data () {
        return {
            show: false,
            isActive: false,
            isChildActive: false
        }
    },
    computed: {
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
        ...mapGetters({
            activeTest: 'tests/active'
        })
    },
    watch: {
        activeTest () {
            if (this.isActive) {
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
        activate () {
            this.showResults(this.test)
            this.$nextTick(() => {
                this.isActive = true
                this.$emit('activate')
            })
        },
        deactivate () {
            this.isActive = false
            this.$emit('deactivate')
        },
        onChildActivation () {
            this.isChildActive = true
            this.breadcrumb(this.test)
            this.$emit('activate')
        },
        onChildDeactivation () {
            this.isChildActive = false
            this.$emit('deactivate')
        },
        ...mapActions({
            showResults: 'tests/show',
            breadcrumb: 'tests/breadcrumb'
        })
    }
}
</script>
