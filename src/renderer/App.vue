<template>
    <div id="app" :class="[`platform--${platform}`]">
        <router-view />
    </div>
</template>

<script>
export default {
    name: 'Lode',
    computed: {
        platform () {
            return process.platform
        }
    }
}
</script>
