<script>
export default {
    name: 'Parameters',
    props: {
        parameters: {
            type: String,
            required: true,
        },
    },
}
</script>

<template>
    <div class="parameters">
        <pre><code>{{ parameters }}</code></pre>
    </div>
</template>
