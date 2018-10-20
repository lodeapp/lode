<template>
    <div class="test-result">
        <div class="tabnav">
            <nav class="tabnav-tabs">
                <a href="#url" class="tabnav-tab selected" aria-current="page">Feedback</a>
            </nav>
        </div>
        <div class="test-result-breakdown">
            <pre v-html="result.feedback"></pre>
        </div>
    </div>
</template>

<script>
export default {
    name: 'TestResult',
    props: {
        result: {
            type: Object,
            required: true
        }
    }
}
</script>
