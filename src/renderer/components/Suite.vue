<template>
    <Group :model="suite" :has-children="suite.testsLoaded && suite.tests.length > 0" class="suite">
        <template slot="header">
            <div class="input--select" @click.stop="onSelective">
                <input type="checkbox" v-model="selected" :indeterminate.prop="suite.partial">
            </div>
            <Filename :path="suite.relative" />
        </template>
        <Test
            v-for="test in suite.tests"
            :key="test.id"
            :test="test"
            :selectable="suite.canToggleTests"
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
        onSelective () {
            this.selected = true
            this.enableSelective()
        },
        ...mapActions({
            enableSelective: 'tree/enableSelective'
        })
    }
}
</script>
