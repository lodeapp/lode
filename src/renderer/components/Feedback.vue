<template>
    <div class="feedback">
        <h4>{{ content.class }}</h4>
        <p class="message">{{ content.message }}</p>
        <Diff v-if="content.diff" :diff="content.diff" />
        <Trace v-if="content.trace" :trace="content.trace" />
    </div>
</template>

<script>
import Diff from '@/components/Diff'
import Trace from '@/components/Trace'

export default {
    name: 'Feedback',
    components: {
        Diff,
        Trace
    },
    props: {
        content: {
            type: Object,
            default () {
                return {}
            }
        }
    },
    methods: {
    }
}
</script>
