<template>
    <div class="test-result">
        <div class="tabnav">
            <nav class="tabnav-tabs">
                <a href="#url" class="tabnav-tab selected" aria-current="page">Feedback</a>
            </nav>
        </div>
        <div class="test-result-breakdown">
            <pre v-if="typeof result.feedback !== 'object'">{{ result.feedback }}</pre>
            <Ansi v-else-if="result.feedback.type === 'ansi'" :content="result.feedback.message" />
        </div>
    </div>
</template>

<script>
import Ansi from '@/components/Ansi'

export default {
    name: 'TestResult',
    components: {
        Ansi
    },
    props: {
        result: {
            type: Object,
            required: true
        }
    }
}
</script>
