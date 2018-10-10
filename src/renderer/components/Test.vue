<template>
    <div
        class="test"
        :class="groupClasses.concat([activeTest && activeTest.id === test.id ? 'is-active' : ''])"
        @click.stop="onClick"
    >
        <div class="header">
            <div class="indicator"></div>
            <div v-if="toggles" class="input--select" @click.stop="onSelective">
                <input type="checkbox" v-model="selected" @click.stop>
            </div>
            <div>{{ test.displayName }}</div>
        </div>
    </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import group from '@/mixins/group'

export default {
    name: 'Test',
    mixins: [group],
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
        model () {
            return this.test
        },
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
