<template>
    <div id="app">
        <div class="contents">
            <!-- <Titlebar :has-project="!!$root.project" /> -->
            <div class="sidebar">
                <ProjectSelector />
            </div>
            <div v-if="!$root.project" class="no-projects">
                <h1>Welcome to Lode.</h1>
                <button class="btn btn-primary" @click="$root.addProject">Add your first project</button>
            </div>
            <Project v-else :key="$root.project.id" />
            <ModalController />
        </div>
    </div>
</template>

<script>
import ProjectSelector from '@/components/ProjectSelector'
import ModalController from '@/components/ModalController'
import Project from '@/components/Project'

export default {
    name: 'Lode',
    components: {
        ProjectSelector,
        ModalController,
        Project
    }
}
</script>
