<template>
    <div class="results" :class="{ blankslate: !test }">
        <h3 v-if="!test">No test selected</h3>
        <div v-else class="parent" :class="[`status--${test.status}`]">
            <div class="header">
                <div class="title">
                    <div class="status">
                        <span class="indicator"></span>
                    </div>
                    <h2 class="heading">{{ test.displayName }}</h2>
                </div>
                <nav class="breadcrumbs" aria-label="Breadcrumb">
                    <ol>
                        <li
                            v-for="breadcrumb in breadcrumbs"
                            :key="breadcrumb.id"
                            class="breadcrumb-item text-small"
                        >{{ breadcrumb.getDisplayName() }}</li>
                    </ol>
                </nav>
            </div>
            <TestResult :result="result" />
        </div>
    </div>
</template>

<script>
import { mapGetters } from 'vuex'
import TestResult from '@/components/TestResult'

export default {
    name: 'Results',
    components: {
        TestResult
    },
    props: {
        test: {
            type: Object,
            default: null
        }
    },
    computed: {
        result () {
            return this.test && this.test.result || {}
        },
        ...mapGetters({
            breadcrumbs: 'tests/breadcrumbs'
        })
    }
}
</script>
