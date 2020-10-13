<template>
    <div class="loading">
        <div class="loading-group">
            <div class="spinner"></div>
            <h2>{{ 'Loading :0…' | set(name) }}</h2>
        </div>
    </div>
</template>

<script>
export default {
    name: 'ProjectLoader',
    props: {
        name: {
            type: String,
            required: true
        }
    }
}
</script>
