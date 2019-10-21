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
                        <button type="button" v-if="parameters" @mousedown="setTab('parameters')" class="tab" :class="{ selected: tab === 'parameters' }">
                            Parameters
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
                <div v-else-if="parameters && tab === 'parameters'">
                    <Parameters :parameters="parameters" />
                </div>
                <div v-else-if="console && tab === 'console'">
                    <Console
                        v-for="(output, index) in console"
                        :key="`console-${index}`"
                        :context="context"
                        :output="output"
                    />
                </div>
                <div v-else-if="suiteConsole && tab === 'suiteConsole'">
                    <Console
                        v-for="(output, index) in suiteConsole"
                        :key="`suiteConsole-${index}`"
                        :context="context"
                        :output="output"
                    />
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
import _identity from 'lodash/identity'
import _indexOf from 'lodash/indexOf'
import _isEmpty from 'lodash/isEmpty'
import _last from 'lodash/last'
import _pickBy from 'lodash/pickBy'
import Ansi from '@/components/Ansi'
import Console from '@/components/Console'
import Feedback from '@/components/Feedback'
import KeyValue from '@/components/KeyValue'
import Parameters from '@/components/Parameters'
import TestInformation from '@/components/TestInformation'

export default {
    name: 'TestResult',
    components: {
        Ansi,
        Console,
        Feedback,
        KeyValue,
        Parameters,
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
            active: null,
            cycleHandler: null
        }
    },
    computed: {
        tab () {
            if (this.active) {
                return this.active
            }

            // If no tab is active, return the first available one.
            return _get(this.availableTabs, '0', '')
        },
        availableTabs () {
            return Object.keys(_pickBy({
                error: this.error,
                feedback: this.feedback && !this.isTransient,
                console: this.console && !this.isTransient,
                suiteConsole: this.suiteConsole && !this.isTransient,
                stats: this.stats,
                parameters: this.parameter && !this.isTransients
            }, _identity))
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
        parameters () {
            return this.result && this.result.params
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
    mounted () {
        let index
        this.cycleHandler = (e) => {
            if (this.availableTabs.length > 1) {
                if (this.$input.isCycleForward(e)) {
                    index = _indexOf(this.availableTabs, this.tab) + 1
                    const forward = this.availableTabs[index >= this.availableTabs.length ? 0 : index]
                    if (forward) {
                        this.setTab(forward)
                    }
                } else if (this.$input.isCycleBackward(e)) {
                    index = _indexOf(this.availableTabs, this.tab) - 1
                    const backward = this.availableTabs[index < 0 ? (this.availableTabs.length - 1) : index]
                    if (backward) {
                        this.setTab(backward)
                    }
                }
            }
        }
        document.addEventListener('keydown', this.cycleHandler)
    },
    destroyed () {
        document.removeEventListener('keydown', this.cycleHandler)
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
