<template>
    <div class="results-pane">
        <div v-if="!test" class="blankslate">
            <h3>No test selected</h3>
        </div>
        <div v-else>
            <div class="header">
                <h2>{{ test.displayName }}</h2>
                <nav aria-label="Breadcrumb">
                    <ol>
                        <li class="breadcrumb-item text-small">{{ 'Suite name' }}</li>
                        <li class="breadcrumb-item breadcrumb-item-selected text-small">{{ 'Suite name' }}</li>
                    </ol>
                </nav>
            </div>
            <div class="tabnav">
                <nav class="tabnav-tabs">
                    <a href="#url" class="tabnav-tab selected" aria-current="page">Feedback</a>
                </nav>
            </div>
            <div class="results">
                <pre v-html="result.feedback"></pre>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'Results',
    props: {
        test: {
            type: Object,
            default: null
        }
    },
    computed: {
        result () {
            return this.test && this.test.result || {}
        }
    }
}
</script>
