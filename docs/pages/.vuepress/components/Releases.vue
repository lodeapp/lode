<template>
    <div class="releases">
        <Release
            v-for="release in releases"
            :key="release.version"
            :release="release"
        />
    </div>
</template>

<script>
import releases from '../../../support/releases.json'

export default {
    data () {
        return {
            releases
        }
    }
}
</script>
