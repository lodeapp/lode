<template>
    <div class="test" :class="[test.status]" @click.stop="show = !show">
        <div>{{ test.displayName }}</div>
        <div v-if="result.feedback">
            <div v-show="show">
                <pre v-html="result.feedback"></pre>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'Test',
    props: {
        test: {
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
        result () {
            return this.test.result || {}
        }
    }
}
</script>
