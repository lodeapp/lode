<template>
    <div class="results" :class="{ blankslate: !testActive || loading }">
        <div class="draggable"></div>
        <h3 v-if="!testActive">No test selected</h3>
        <div v-if="loading" class="loading">
            <div class="loading-group">
                <div class="spinner"></div>
            </div>
        </div>
        <div v-if="test && !loading" class="has-status" :class="[`status--${test.getStatus()}`]">
            <div class="header">
                <div class="title">
                    <Indicator :status="test.getStatus()" />
                    <h2 class="heading">{{ test.getDisplayName() }}</h2>
                </div>
                <nav class="breadcrumbs" aria-label="Breadcrumb">
                    <ol>
                        <li
                            v-for="breadcrumb in breadcrumbs"
                            :key="breadcrumb.getId()"
                            class="breadcrumb-item text-small"
                        >{{ breadcrumb.getDisplayName() }}</li>
                    </ol>
                </nav>
            </div>
            <TestResult :context="context" :key="$string.from(test)" />
        </div>
    </div>
</template>

<script>
import { mapGetters } from 'vuex'
import _last from 'lodash/last'
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
            loading: false
        }
    },
    computed: {
        test () {
            if (this.context.length > 2) {
                return _last(this.context)
            }
            return null
        },
        breadcrumbs () {
            // Remove repository and framework from breadcrumbs, as it feels
            // like an unnecessary repetition. We want both in the complete
            // context for other purposes, just not necessarily here.
            return this.context.slice(2, (this.context.length - 1))
        },
        ...mapGetters({
            testActive: 'test/active'
        })
    },
    watch: {
        testActive (test) {
            if (!test) {
                this.$emit('reset')
                return
            }
            this.loading = true
        },
        context () {
            this.loading = false
        }
    }
}
</script>
