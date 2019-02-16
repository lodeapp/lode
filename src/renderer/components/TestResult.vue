<template>
    <div class="test-result">
        <div class="tabnav">
            <nav class="tabnav-tabs">
                <a v-if="content" @click="selected = 'content'" class="tabnav-tab" :class="{ selected: selected === 'content' }">Feedback</a>
                <a v-if="stats" @click="selected = 'stats'" class="tabnav-tab" :class="{ selected: selected === 'stats' }">Statistics</a>
            </nav>
        </div>
        <div class="test-result-breakdown">
            <div v-if="content">
                <div v-show="selected === 'content'">
                    <KeyValue v-if="result.feedback.type === 'object'" :object="content || {}" />
                    <Ansi v-else-if="result.feedback.type === 'ansi'" :content="content" />
                </div>
            </div>
            <div v-if="stats">
                <div v-show="selected === 'stats'">
                    <TestStatistics :stats="stats" />
                </div>
            </div>
            <div v-if="empty">Awaiting test data.</div>
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
        const content = this.test.result && this.test.result.feedback && this.test.result.feedback.content
        return {
            stats,
            content,
            selected: content ? 'content' : 'stats'
        }
    },
    computed: {
        result () {
            return this.test.result || {}
        },
        empty () {
            return !this.content && !this.stats
        }
    }
}
</script>
