<template>
    <div class="titlebar" :class="{ 'empty': !hasProject }">
        <div v-if="hasProject" class="titlebar-section">
            <ProjectSelector class="titlebar-button" />
        </div>
    </div>
</template>

<script>
import ProjectSelector from '@/components/ProjectSelector'
export default {
    name: 'Titlebar',
    components: {
        ProjectSelector
    },
    props: {
        hasProject: {
            type: Boolean,
            default: false
        }
    }
}
</script>
