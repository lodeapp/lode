<template>
    <div class="results" :class="{ blankslate: !testActive || loading }">
        <h3 v-if="!testActive">No test selected</h3>
        <div v-if="loading" class="loading">
            <div class="loading-group">
                <div class="spinner"></div>
            </div>
        </div>
        <div v-if="testActive && !loading" class="has-status" :class="[`status--${status}`]">
            <div class="header">
                <div class="title">
                    <Indicator :status="status" />
                    <h2 class="heading">{{ displayName }}</h2>
                </div>
                <nav class="breadcrumbs" aria-label="Breadcrumb">
                    <ol>
                        <li
                            v-for="breadcrumb in breadcrumbs"
                            :key="$string.from(breadcrumb)"
                            class="breadcrumb-item text-small"
                        >{{ breadcrumb.relative || breadcrumb.name }}</li>
                    </ol>
                </nav>
            </div>
            <TestResult
                :key="$string.from(test)"
                :framework="framework"
                :suite="suite"
                :test="test"
                :status="status"
            />
        </div>
    </div>
</template>

<script>
import _clone from 'lodash/clone'
import _last from 'lodash/last'
import { mapGetters } from 'vuex'
import Indicator from '@/components/Indicator'
import TestResult from '@/components/TestResult'

export default {
    name: 'Results',
    components: {
        Indicator,
        TestResult
    },
    props: {
        context: {
            type: Array,
            required: true
        }
    },
    data () {
        return {
            loading: false,
            status: 'idle',
            breadcrumbs: [],
            framework: {},
            suite: {},
            test: {}
        }
    },
    computed: {
        identifier () {
            return _last(this.context)
        },
        displayName () {
            return this.test.displayName || this.test.name
        },
        ...mapGetters({
            testActive: 'context/test'
        })
    },
    watch: {
        testActive (test) {
            if (!test) {
                this.test = {}
                this.$emit('reset')
                return
            }
            this.loading = true
        }
    },
    async created () {
        const context = _clone(this.context)
        Lode.ipc.on(`${this.identifier}:status:active`, this.statusListener)
        const frameworkId = context.shift()
        const { framework, nuggets } = JSON.parse(await Lode.ipc.invoke('test-get', frameworkId, context))
        this.breadcrumbs = nuggets
        this.framework = framework
        this.test = nuggets.pop()
        this.suite = nuggets.shift()
        this.status = this.test.status
        this.loading = false
    },
    beforeDestroy () {
        Lode.ipc.removeAllListeners(`${this.identifier}:status:active`)
    },
    methods: {
        statusListener (event, payload) {
            this.$payload(payload, (to, from) => {
                this.status = to
            })
        }
    }
}
</script>
