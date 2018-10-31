<template>
    <div id="app" :class="[`platform--${platform}`]">
        <router-view />
    </div>
</template>

<script>
import TitleBar from '@/components/TitleBar'
export default {
    name: 'TestRunner',
    components: {
        TitleBar
    },
    computed: {
        platform () {
            return process.platform
        }
    }
}
</script>
