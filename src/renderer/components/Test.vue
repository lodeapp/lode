<template>
    <Nugget
        :model="test"
        class="test"
        :class="{ 'is-active': isActive, 'is-child-active': isChildActive }"
        :has-children="hasChildren"
        :handler="onClick"
    >
        <template slot="header">
            <div v-if="selectable" class="selective-toggle" :class="{ disabled: running }" @click.stop="selected = true">
                <button type="button" :disabled="running"></button>
                <input type="checkbox" v-model="selected" :disabled="running">
            </div>
            <div class="test-name" :title="test.displayName">{{ test.displayName }}</div>
        </template>
        <template v-if="hasChildren">
            <Test
                v-for="test in test.tests"
                :key="test.id"
                :test="test"
                :running="running"
                :selectable="selectable"
                @activate="onChildActivation"
                @deactivate="onChildDeactivation"
            />
        </template>
    </Nugget>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
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
    mounted () {
        this.test.on('debriefed', () => {
            if (this.isActive) {
                this.refresh()
            }
        })
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
        refresh () {
            this.activate()
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
