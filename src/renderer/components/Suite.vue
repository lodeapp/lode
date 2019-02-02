<template>
    <Nugget
        :model="suite"
        class="suite"
        :class="{ 'is-child-active': isChildActive }"
        :has-children="suite.testsLoaded && suite.tests.length > 0"
    >
        <template slot="header">
            <div class="selective-toggle" :class="{ disabled: running }" @click.stop="onSelectiveClick">
                <button type="button" :disabled="running"></button>
                <input type="checkbox" v-model="selected" :indeterminate.prop="suite.partial" :disabled="running">
            </div>
            <Filename :path="suite.relative" :key="suite.relative" />
        </template>
        <Test
            v-for="test in suite.tests"
            :key="test.id"
            :model="test"
            :running="running"
            :selectable="suite.canToggleTests"
            @activate="onChildActivation"
            @deactivate="onChildDeactivation"
        />
    </Nugget>
</template>

<script>
import Nugget from '@/components/Nugget'
import Filename from '@/components/Filename'
import Breadcrumb from '@/components/mixins/breadcrumb'

export default {
    name: 'Suite',
    components: {
        Nugget,
        Filename
    },
    mixins: [
        Breadcrumb
    ],
    props: {
        model: {
            type: Object,
            required: true
        },
        running: {
            type: Boolean,
            default: false
        }
    },
    computed: {
        suite () {
            return this.model
        },
        selected: {
            get () {
                return this.suite.selected
            },
            set (checked) {
                this.suite.toggleSelected(checked)
            }
        }
    },
    methods: {
        onSelectiveClick (event) {
            if (this.running) {
                return
            }
            const input = this.$el.querySelector('.selective-toggle input')
            if (event.target !== input && !this.suite.selected) {
                input.click()
            }
        }
    }
}
</script>
