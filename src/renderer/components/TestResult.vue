<template>
    <div class="test-result">
        <div class="tabs">
            <nav>
                <button
                    v-if="error"
                    type="button"
                    class="tab"
                    :class="{ selected: tab === 'error' }"
                    @mousedown="setTab('error')"
                >Error</button>
                <template v-else>
                    <template v-if="!isTransient">
                        <button
                            v-if="feedback"
                            type="button"
                            class="tab"
                            :class="{ selected: tab === 'feedback' }"
                            @mousedown="setTab('feedback')"
                        >Feedback</button>
                        <button
                            v-if="parameters"
                            type="button"
                            class="tab"
                            :class="{ selected: tab === 'parameters' }"
                            @mousedown="setTab('parameters')"
                        >Parameters</button>
                        <button
                            v-if="console"
                            type="button"
                            class="tab"
                            :class="{ selected: tab === 'console' }"
                            @mousedown="setTab('console')"
                        >Console</button>
                        <button
                            v-if="suiteConsole"
                            type="button"
                            class="tab"
                            :class="{ selected: tab === 'suiteConsole' }"
                            @mousedown="setTab('suiteConsole')"
                        >Suite Console</button>
                    </template>
                </template>
                <button
                    v-if="stats"
                    type="button"
                    class="tab"
                    :class="{ selected: tab === 'stats' }"
                    @mousedown="setTab('stats')"
                >Information</button>
            </nav>
        </div>
        <div class="test-result-breakdown">
            <div class="test-result-general" v-if="error && tab === 'error'">
                <p>An unexpected error prevented this test from running.</p>
                <p v-if="framework" v-markdown.set="framework.name" @click.prevent="$input.on($event, 'a', refreshFramework)">
                    {{ 'If tests have been removed, [refresh :0](#) to clear them from the list.' }}
                </p>
            </div>
            <div v-else-if="!isTransient">
                <div v-if="feedback && tab === 'feedback'">
                    <Feedback v-if="feedback.type === 'feedback'" :content="feedback.content || {}" />
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
                        :output="output"
                    />
                </div>
                <div v-else-if="suiteConsole && tab === 'suiteConsole'">
                    <Console
                        v-for="(output, index) in suiteConsole"
                        :key="`suiteConsole-${index}`"
                        :output="output"
                    />
                </div>
            </div>
            <div v-if="stats && tab === 'stats'">
                <TestInformation
                    :key="$string.from([status, stats])"
                    :status="status"
                    :stats="stats"
                />
            </div>
        </div>
    </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { get, identity, indexOf, isEmpty, pickBy } from 'lodash'
import Ansi from '@/components/Ansi.vue'
import Console from '@/components/Console.vue'
import Feedback from '@/components/Feedback.vue'
import KeyValue from '@/components/KeyValue.vue'
import Parameters from '@/components/Parameters.vue'
import TestInformation from '@/components/TestInformation.vue'

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
        framework: {
            type: Object,
            required: true
        },
        results: {
            type: Object,
            required: true
        },
        status: {
            type: String,
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
            } else if (this.lastActiveTab) {
                // If store has a previously active tab from other results,
                // and that same tab exists in this new pane, set that in order
                // to allow some consistency when navigating between test results.
                if (indexOf(this.availableTabs, this.lastActiveTab) > -1) {
                    return this.lastActiveTab
                }
            }

            // If no tab is active, return the first available one.
            return get(this.availableTabs, '0', '')
        },
        availableTabs () {
            return Object.keys(pickBy({
                error: this.error,
                feedback: this.feedback && !this.isTransient,
                parameters: this.parameters && !this.isTransient,
                console: this.console && !this.isTransient,
                suiteConsole: this.suiteConsole && !this.isTransient,
                stats: this.stats
            }, identity))
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
        feedback () {
            return this.results && this.results.feedback && this.results.feedback.content ? this.results.feedback : false
        },
        parameters () {
            return this.results && this.results.params
        },
        console () {
            return this.results && this.results.console && this.results.console.length ? this.results.console : false
        },
        stats () {
            return this.results && this.results.stats && !isEmpty(this.results.stats) ? this.results.stats : false
        },
        suiteConsole () {
            // Hide suite console output until test is in a definitive state
            if (this.isRunning) {
                return false
            }

            return get(this.results, 'suite-console', false)
        },
        ...mapGetters({
            lastActiveTab: 'tabs/lastActive'
        })
    },
    mounted () {
        let index
        this.cycleHandler = event => {
            if (this.availableTabs.length > 1) {
                if (this.$input.isNumeral(event) && this.$input.hasCmdOrCtrl(event)) {
                    index = event.key - 1 // Tab order starts at 1, not zero.
                    const seek = this.availableTabs[index]
                    if (seek) {
                        this.setTab(seek)
                    }
                } else if (this.$input.isCycleForward(event)) {
                    index = indexOf(this.availableTabs, this.tab) + 1
                    const forward = this.availableTabs[index >= this.availableTabs.length ? 0 : index]
                    if (forward) {
                        this.setTab(forward)
                    }
                } else if (this.$input.isCycleBackward(event)) {
                    index = indexOf(this.availableTabs, this.tab) - 1
                    const backward = this.availableTabs[index < 0 ? (this.availableTabs.length - 1) : index]
                    if (backward) {
                        this.setTab(backward)
                    }
                }
            }
        }
        document.addEventListener('keydown', this.cycleHandler)
    },
    unmounted () {
        document.removeEventListener('keydown', this.cycleHandler)
    },
    methods: {
        setTab (tab) {
            this.active = tab
            this.setLastActiveTab(this.active)
        },
        refreshFramework () {
            Lode.ipc.send('framework-refresh', this.framework.id)
        },
        ...mapActions({
            setLastActiveTab: 'tabs/setLastActive'
        })
    }
}
</script>
