<template>
    <div class="suite" :class="[suite.status]" @click="show = !show">
        <div>{{ suite.relative }}</div>
        <ul v-show="show">
            <li v-for="test in suite.tests" :key="test.name">
                <Test :test="test" />
            </li>
        </ul>
    </div>
</template>

<script>
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
    }
}
</script>
