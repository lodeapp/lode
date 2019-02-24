<template>
    <div id="app" :class="[`platform--${platform}`]">
        <div class="contents" v-if="empty !== null">
            <Titlebar :has-project="!!project" />
            <div v-if="empty" class="no-projects">
                <h1>Welcome to Lode.</h1>
                <button class="btn btn-primary" @click="$root.addProject">Add your first project</button>
            </div>
            <Project
                v-if="project"
                :project="project"
                :key="project.id"
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
        platform () {
            return process.platform
        },
        empty () {
            return !this.project
        }
    }
}
</script>
