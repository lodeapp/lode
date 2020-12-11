<template>
    <div id="app">
        <div class="contents">
            <template v-if="$root.ready">
                <div v-if="!$root.loading && !$root.project" class="no-projects">
                    <h1>Welcome to Lode.</h1>
                    <button class="btn btn-primary" @click="$root.projectAdd">Add your first project</button>
                </div>
                <ProjectLoader
                    v-else-if="!$root.project"
                />
                <Project
                    v-else
                    :key="$root.project.id"
                    :model="$root.project"
                />
                <ModalController />
            </template>
        </div>
    </div>
</template>

<script>
import ModalController from '@/components/ModalController'
import ProjectLoader from '@/components/ProjectLoader'
import Project from '@/components/Project'

export default {
    name: 'Lode',
    components: {
        ModalController,
        ProjectLoader,
        Project
    }
}
</script>
