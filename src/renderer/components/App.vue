<template>
    <div id="app">
        <div class="contents">
            <div v-if="!$root.project" class="no-projects">
                <h1>Welcome to Lode.</h1>
                <button class="btn btn-primary" @click="$root.addProject">Add your first project</button>
            </div>
            <Project v-else :model="$root.project" :key="$root.project.id" />
            <ModalController />
        </div>
    </div>
</template>

<script>
import ModalController from '@/components/ModalController'
import Project from '@/components/Project'

export default {
    name: 'Lode',
    components: {
        ModalController,
        Project
    }
}
</script>
