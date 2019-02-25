<template>
    <div id="app">
        <div class="contents" v-if="empty !== null">
            <Titlebar :project="project" />
            <div v-if="empty" class="no-projects">
                <h1>Welcome to Lode.</h1>
                <button class="btn btn-primary" @click="$root.addProject">Add your first project</button>
            </div>
            <Project
                v-if="project"
                :project="project"
                :key="project.getId()"
            />
            <ModalController />
        </div>
    </div>
</template>

<script>
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
    props: {
        project: {
            type: [Object, null],
            default: null
        }
    },
    computed: {
        empty () {
            return !this.project
        }
    }
}
</script>
