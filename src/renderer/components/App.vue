<template>
    <Titlebar v-if="$root.menu" :sections="$root.menu" />
    <div class="contents">
        <template v-if="$root.ready">
            <main v-if="!$root.loading && !$root.project" class="no-projects">
                <h1>Welcome to Lode.</h1>
                <button class="btn btn-primary" @click="$root.projectAdd">Add your first project</button>
            </main>
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
</template>

<script>
import Titlebar from '@/components/Titlebar'
import ModalController from '@/components/ModalController'
import ProjectLoader from '@/components/ProjectLoader'
import Project from '@/components/Project'

export default {
    name: 'Lode',
    components: {
        Titlebar,
        ModalController,
        ProjectLoader,
        Project
    }
}
</script>
