<template>
    <Group
        :model="test"
        class="test"
        :class="[activeTest && activeTest.id === test.id ? 'is-active' : '']"
        :has-children="hasChildren"
        @click.native.stop="onClick"
    >
        <template slot="header">
            <div v-if="toggles" class="input--select" @click.stop="onSelective">
                <input type="checkbox" v-model="selected" @click.stop>
            </div>
            <div>{{ test.displayName }}</div>
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
        toggles: {
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
        hasChildren () {
            // @TODO: nested tests should show children instead of
            // toggling active test to show results
            return false
        },
        selected: {
            get () {
                return this.test.selected
            },
            set (checked) {
                this.test.toggleSelected(checked)
                this.$emit('selected', checked)
            }
        },
        ...mapGetters({
            activeTest: 'tests/active'
        })
    },
    methods: {
        onSelective () {
            this.selected = true
            this.enableSelective()
        },
        onClick () {
            if (this.hasChildren) {
                this.toggleChildren()
                return
            }
            this.showResults(this.test)
        },
        ...mapActions({
            enableSelective: 'tree/enableSelective',
            showResults: 'tests/show'
        })
    }
}
</script>
