<template>
    <Group
        :model="suite"
        class="suite"
        :class="{ 'is-child-active': isChildActive }"
        :has-children="suite.testsLoaded && suite.tests.length > 0"
    >
        <template slot="header">
            <div class="selective-toggle" @click.stop="selected = true">
                <button type="button"></button>
                <input type="checkbox" v-model="selected" :indeterminate.prop="suite.partial">
            </div>
            <Filename :path="suite.relative" />
        </template>
        <Test
            v-for="test in suite.tests"
            :key="test.id"
            :test="test"
            :selectable="suite.canToggleTests"
            @activate="onChildActivation"
            @deactivate="onChildDeactivation"
        />
    </Group>
</template>

<script>
import { mapActions } from 'vuex'
import Group from '@/components/Group'
import Filename from '@/components/Filename'

export default {
    name: 'Suite',
    components: {
        Group,
        Filename
    },
    props: {
        suite: {
            type: Object,
            required: true
        }
    },
    data () {
        return {
            isChildActive: false
        }
    },
    computed: {
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
        onChildActivation () {
            this.isChildActive = true
            this.breadcrumb(this.suite)
            this.$emit('activate')
        },
        onChildDeactivation () {
            this.isChildActive = false
            this.$emit('deactivate')
        },
        ...mapActions({
            breadcrumb: 'tests/breadcrumb'
        })
    }
}
</script>
