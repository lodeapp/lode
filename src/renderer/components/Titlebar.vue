<template>
    <div class="titlebar" :class="{ 'empty': !project }">
        <div v-if="project" class="titlebar-section">
            <ProjectSelector :project="project" class="titlebar-button" />
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
        project: {
            type: [Object, Boolean],
            default: false
        }
    }
}
</script>
