<template>
    <div class="results" :class="{ blankslate: !test }">
        <h3 v-if="!test">No test selected</h3>
        <div v-else class="parent" :class="[`status--${test.status}`]">
            <div class="header">
                <div class="title">
                    <Indicator :status="test.status" />
                    <h2 class="heading">{{ test.displayName }}</h2>
                </div>
                <nav class="breadcrumbs" aria-label="Breadcrumb">
                    <ol>
                        <li
                            v-for="breadcrumb in breadcrumbs"
                            :key="breadcrumb.id"
                            class="breadcrumb-item text-small"
                        >{{ breadcrumb.name }}</li>
                    </ol>
                </nav>
            </div>
            <TestResult :test="test" :key="$string.from(test)" />
        </div>
    </div>
</template>

<script>
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
        test: {
            type: Object,
            default: null
        }
    },
    computed: {
        breadcrumbs () {
            // Remove repository and framework from breadcrumbs, as it feels
            // like an unnecessary repetition. We want both in the complete
            // breadcrumbs for other purposes, not necessarily here.
            return this.allBreadcrumbs.slice(2)
        },
        ...mapGetters({
            allBreadcrumbs: 'tests/breadcrumbs'
        })
    }
}
</script>
