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
                :model="test"
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
    data () {
        return {
            show: false,
            isActive: false
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
        ...mapGetters({
            activeTest: 'tests/active'
        })
    },
    watch: {
        activeTest (active) {
            if (this.isActive && active.id !== this.test.id) {
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
        this.test.on('status', (to, from) => {
            if (this.isActive && to === 'queued') {
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
        ...mapActions({
            showResults: 'tests/show'
        })
    }
}
</script>
