<template>
    <div class="diff">
        <Snippet :code="diff" language="diff" />
    </div>
</template>

<script>
import Snippet from '@/components/Snippet'

export default {
    name: 'Diff',
    components: {
        Snippet
    },
    props: {
        diff: {
            type: String,
            required: true
        }
    }
}
</script>
