<template>
    <div class="test-result">
        <div class="tabnav">
            <nav class="tabnav-tabs">
                <a v-if="feedback" @click="selected = 'feedback'" class="tabnav-tab" :class="{ selected: selected === 'feedback' }">Feedback</a>
                <a v-if="stats" @click="selected = 'stats'" class="tabnav-tab" :class="{ selected: selected === 'stats' }">Statistics</a>
            </nav>
        </div>
        <div class="test-result-breakdown">
            <div v-if="feedback">
                <div v-show="selected === 'feedback'">
                    <KeyValue v-if="feedback.type === 'object'" :object="feedback.content || {}" />
                    <Ansi v-else-if="feedback.type === 'ansi'" :content="content" />
                </div>
            </div>
            <div v-if="stats">
                <div v-show="selected === 'stats'">
                    <TestStatistics :stats="stats" />
                </div>
            </div>
            <div class="test-result-general" v-if="empty">
                <div v-if="status === 'error'">
                    <p>An unexpected error prevented this test from running.</p>
                    <p v-if="framework" v-markdown.set="framework.getDisplayName()" @click.prevent="$input.on($event, 'a', refreshFramework)">
                        {{ 'If tests have been removed, [refresh :0](#) to clear them from the list.' }}
                    </p>
                </div>
                <div v-else>Awaiting test data.</div>
            </div>
        </div>
    </div>
</template>

<script>
import _get from 'lodash/get'
import _isEmpty from 'lodash/isEmpty'
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
        const result = this.test.result || {}
        const stats = result && result.stats && !_isEmpty(result.stats) ? result.stats : false
        const feedback = result && result.feedback && result.feedback.content ? result.feedback : false
        return {
            stats,
            feedback,
            selected: feedback ? 'feedback' : 'stats'
        }
    },
    computed: {
        status () {
            return this.test.getStatus()
        },
        empty () {
            return !this.content && !this.stats
        },
        framework () {
            return _get(this.$root.active.breadcrumbs, 1)
        }
    },
    methods: {
        refreshFramework () {
            if (!this.framework) {
                return
            }
            this.framework.refresh()
        }
    }
}
</script>
