<template>
    <div class="suite" :class="[suite.status]">
        <div>
            <span style="display: inline-block; min-width: 18px; min-height: 19px; cursor: pointer;" @click="onSelective">
                <input type="checkbox" v-model="selected">
            </span>
            <span @click="show = !show">{{ suite.relative }}</span>
        </div>
        <ul v-show="show">
            <li v-for="test in suite.tests" :key="test.name">
                <Test :test="test" :toggles="suite.canToggleTests" @selected="onTestSelected" />
            </li>
        </ul>
    </div>
</template>

<script>
import { mapActions } from 'vuex'
import Test from '@/components/Test'

export default {
    name: 'Suite',
    components: {
        Test
    },
    props: {
        suite: {
            type: Object,
            required: true
        }
    },
    data () {
        return {
            show: false
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
