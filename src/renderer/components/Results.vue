<template>
    <div class="results" :class="{ blankslate: !activeTest || loading }">
        <h3 v-if="!activeTest">No test selected</h3>
        <div v-if="loading" class="loading">
            <div class="loading-group">
                <div class="spinner"></div>
            </div>
        </div>
        <div v-if="activeTest && !loading" class="has-status" :class="[`status--${status}`]">
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
                :key="$string.from([test, results])"
                :framework="framework"
                :results="results"
                :status="status"
            />
        </div>
    </div>
</template>

<script>
import { clone, last } from 'lodash'
import { mapGetters } from 'vuex'
import Indicator from '@/components/Indicator.vue'
import TestResult from '@/components/TestResult.vue'

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
            breadcrumbs: [],
            framework: {},
            test: {},
            results: {}
        }
    },
    computed: {
        identifier () {
            return last(this.context)
        },
        status () {
            return this.getStatus(this.identifier)
        },
        displayName () {
            return this.test.displayName || this.test.name
        },
        ...mapGetters({
            activeTest: 'context/test',
            suitesKey: 'context/suitesKey',
            getStatus: 'status/nugget'
        })
    },
    watch: {
        status () {
            this.load()
        },
        suitesKey () {
            this.load()
        }
    },
    mounted () {
        this.load()
    },
    methods: {
        async load () {
            if (this.context.length < 3) {
                return
            }
            this.loading = true
            const context = clone(this.context)
            const frameworkId = context.shift()
            const { framework, nuggets, results } = await Lode.ipc.invoke('test-get', frameworkId, context)
            if (!framework) {
                // If an error occurs when trying to get a test, assume it's
                // been removed and force user to select another.
                this.$store.commit('context/CLEAR_NUGGETS')
                this.loading = false
                return
            }
            this.breadcrumbs = nuggets
            this.framework = framework
            this.test = nuggets.pop()
            this.results = results
            this.loading = false
        }
    }
}
</script>
