<template>
    <div id="app">
        <div class="contents">
            <Titlebar :has-project="!empty" />
            <div v-if="empty" class="no-projects">
                <h1>Welcome to Lode.</h1>
                <button class="btn btn-primary" @click="$root.addProject">Add your first project</button>
            </div>
            <Project v-else :key="projectId" />
            <ModalController />
        </div>
    </div>
</template>

<script>
import { mapGetters } from 'vuex'
import Titlebar from '@/components/Titlebar'
import ModalController from '@/components/ModalController'
import Project from '@/components/Project'

export default {
    name: 'Lode',
    components: {
        Titlebar,
        ModalController,
        Project
    },
    computed: {
        ...mapGetters({
            empty: 'project/empty',
            projectId: 'project/id'
        })
    }
}
</script>
