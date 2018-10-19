<template>
    <Group
        :model="test"
        class="test"
        :class="[activeTest && activeTest.id === test.id ? 'is-active' : '']"
        :has-children="hasChildren"
        :handler="onClick"
    >
        <template slot="header">
            <div v-if="selectable" class="input--select" @click.stop="onSelective">
                <input type="checkbox" v-model="selected" @click.stop>
            </div>
            <div class="test-name">{{ test.displayName }}</div>
        </template>
        <template v-if="hasChildren">
            <Test
                v-for="test in test.tests"
                :key="test.id"
                :test="test"
                :selectable="selectable"
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
            show: false
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
    methods: {
        onSelective () {
            this.selected = true
            this.enableSelective()
        },
        onClick () {
            if (!this.hasChildren) {
                this.showResults(this.test)
                return false
            }
        },
        ...mapActions({
            enableSelective: 'tree/enableSelective',
            showResults: 'tests/show'
        })
    }
}
</script>
