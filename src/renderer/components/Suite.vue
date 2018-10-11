<template>
    <Group :model="suite" class="suite">
        <template slot="header">
            <div class="input--select" @click.stop="onSelective">
                <input type="checkbox" v-model="selected">
            </div>
            <Filename :path="suite.relative" />
        </template>
        <Test
            v-for="test in suite.tests"
            :key="test.name"
            :test="test"
            :toggles="suite.canToggleTests"
            @selected="onTestSelected"
        />
    </Group>
</template>

<script>
import { mapActions } from 'vuex'
import Group from '@/components/Group'
import Filename from '@/components/Filename'
import Test from '@/components/Test'

export default {
    name: 'Suite',
    components: {
        Group,
        Filename,
        Test
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
        onTestSelected (checked) {
            if (checked) {
                this.suite.toggleSelected(true, false)
            } else if (this.suite.noTestsSelected()) {
                this.suite.toggleSelected(false, false)
            }
        },
        ...mapActions({
            enableSelective: 'tree/enableSelective'
        })
    }
}
</script>
