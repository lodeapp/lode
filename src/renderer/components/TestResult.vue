<template>
    <div class="test-result">
        <div class="tabs">
            <nav>
                <template v-if="error">
                    <button type="button" @mousedown="setTab('error')" class="tab" :class="{ selected: tab === 'error' }">
                        Error
                    </button>
                </template>
                <template v-else>
                    <template v-if="!isTransient">
                        <button type="button" v-if="feedback" @mousedown="setTab('feedback')" class="tab" :class="{ selected: tab === 'feedback' }">
                            Feedback
                        </button>
                        <button type="button" v-if="console" @mousedown="setTab('console')" class="tab" :class="{ selected: tab === 'console' }">
                            Console
                        </button>
                        <button type="button" v-if="suiteConsole" @mousedown="setTab('suiteConsole')" class="tab" :class="{ selected: tab === 'suiteConsole' }">
                            Suite Console
                        </button>
                    </template>
                </template>
                <button type="button" v-if="stats" @mousedown="setTab('stats')" class="tab" :class="{ selected: tab === 'stats' }">
                    Information
                </button>
            </nav>
        </div>
        <div class="test-result-breakdown">
            <div class="test-result-general" v-if="error && tab === 'error'">
                <p>An unexpected error prevented this test from running.</p>
                <p v-if="framework" v-markdown.set="framework.getDisplayName()" @click.prevent="$input.on($event, 'a', refreshFramework)">
                    {{ 'If tests have been removed, [refresh :0](#) to clear them from the list.' }}
                </p>
            </div>
            <div v-else-if="!isTransient">
                <div v-if="feedback && tab === 'feedback'">
                    <Feedback v-if="feedback.type === 'feedback'" :context="context" :content="feedback.content || {}" />
                    <KeyValue v-else-if="feedback.type === 'object'" :object="feedback.content || {}" />
                    <Ansi v-else-if="feedback.type === 'ansi'" :content="feedback.content" />
                    <!-- Catch-all for unknown content -->
                    <pre v-else><code>{{ feedback.content }}</code></pre>
                </div>
                <div v-else-if="console && tab === 'console'">
                    <Console v-for="(output, index) in console" :key="`console-${index}`" :output="output" />
                </div>
                <div v-else-if="suiteConsole && tab === 'suiteConsole'">
                    <Console v-for="(output, index) in suiteConsole" :key="`suiteConsole-${index}`" :output="output" />
                </div>
            </div>
            <div v-if="stats && tab === 'stats'">
                <TestInformation
                    :status="status"
                    :stats="stats"
                />
            </div>
        </div>
    </div>
</template>

<script>
import _get from 'lodash/get'
import _isEmpty from 'lodash/isEmpty'
import _last from 'lodash/last'
import Ansi from '@/components/Ansi'
import Console from '@/components/Console'
import Feedback from '@/components/Feedback'
import KeyValue from '@/components/KeyValue'
import TestInformation from '@/components/TestInformation'

export default {
    name: 'TestResult',
    components: {
        Ansi,
        Console,
        Feedback,
        KeyValue,
        TestInformation
    },
    props: {
        context: {
            type: Array,
            required: true
        }
    },
    data () {
        return {
            active: null
        }
    },
    computed: {
        tab () {
            if (this.active) {
                return this.active
            } else if (this.error) {
                return 'error'
            } else if (this.isTransient) {
                return 'stats'
            } else if (this.feedback) {
                return 'feedback'
            } else if (this.console) {
                return 'console'
            } else if (this.suiteConsole) {
                return 'suiteConsole'
            } else if (this.stats) {
                return 'stats'
            }
        },
        test () {
            return _last(this.context)
        },
        status () {
            return this.test.getStatus()
        },
        error () {
            return this.status === 'error'
        },
        isRunning () {
            return ['queued', 'running'].indexOf(this.status) > -1
        },
        isTransient () {
            return ['idle', 'queued', 'running'].indexOf(this.status) > -1
        },
        result () {
            return this.test.result || {}
        },
        feedback () {
            return this.result && this.result.feedback && this.result.feedback.content ? this.result.feedback : false
        },
        console () {
            return this.result && this.result.console && this.result.console.length ? this.result.console : false
        },
        stats () {
            return this.result && this.result.stats && !_isEmpty(this.result.stats) ? this.result.stats : false
        },
        framework () {
            return _get(this.context, 1)
        },
        suite () {
            return _get(this.context, 2)
        },
        suiteConsole () {
            // Hide suite console output until test is in a definitive state
            if (this.isRunning) {
                return false
            }

            return this.suite && this.suite.getConsole() && this.suite.getConsole().length ? this.suite.getConsole() : false
        }
    },
    methods: {
        setTab (tab) {
            this.active = tab
        },
        refreshFramework () {
            if (!this.framework) {
                return
            }
            this.framework.refresh()
        }
    }
}
</script>
