<template>
    <div class="results">
        <div v-if="!test" class="blankslate">
            <h3>No test selected</h3>
        </div>
        <div v-else class="parent" :class="[`status--${test.status}`]">
            <div class="header">
                <div class="title">
                    <div class="status">
                        <span class="indicator"></span>
                    </div>
                    <h2 class="heading">{{ test.displayName }}</h2>
                </div>
                <nav class="breadcrumb" aria-label="Breadcrumb">
                    <ol>
                        <li v-for="crumb in breadcrumb" :key="crumb.id" class="breadcrumb-item text-small">{{ crumb.getDisplayName() }}</li>
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
    data () {
        return {
            crumbs: []
        }
    },
    computed: {
        result () {
            return this.test && this.test.result || {}
        },
        ...mapGetters({
            breadcrumb: 'tests/breadcrumb'
        })
    },
    watch: {
        breadcrumb () {
            this.crumbs = this.breadcrumb.map(crumb => crumb.getDisplayName())
        }
    }
}
</script>