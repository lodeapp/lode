<template>
    <div class="test-result">
        <div class="tabnav">
            <nav class="tabnav-tabs">
                <a v-if="message" @click="selected = 'message'" class="tabnav-tab" :class="{ selected: selected === 'message' }">Message</a>
                <a v-if="stats" @click="selected = 'stats'" class="tabnav-tab" :class="{ selected: selected === 'stats' }">Statistics</a>
            </nav>
        </div>
        <div class="test-result-breakdown">
            <div v-if="message">
                <div v-show="selected === 'message'">
                    <KeyValue v-if="result.feedback.type === 'object'" :object="message || {}" />
                    <Ansi v-else-if="result.feedback.type === 'ansi'" :content="message" />
                </div>
            </div>
            <div v-if="stats">
                <div v-show="selected === 'stats'">
                    <TestStatistics :stats="stats" />
                </div>
            </div>
            <div v-if="empty">No test data.</div>
        </div>
    </div>
</template>

<script>
import Ansi from '@/components/Ansi'
import KeyValue from '@/components/KeyValue'
import TestStatistics from '@/components/TestStatistics'

export default {
    name: 'TestResult',
    components: {
        Ansi,
        KeyValue,
        TestStatistics
    },
    props: {
        test: {
            type: Object,
            required: true
        }
    },
    data () {
        const stats = this.test.result && this.test.result.stats
        const message = this.test.result && this.test.result.feedback && this.test.result.feedback.message
        return {
            stats,
            message,
            selected: message ? 'message' : 'stats'
        }
    },
    computed: {
        result () {
            return this.test.result || {}
        },
        empty () {
            return !this.message && !this.stats
        }
    }
}
</script>
