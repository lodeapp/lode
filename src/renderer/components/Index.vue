<template>
    <div class="contents" v-if="empty !== null">
        <Titlebar :project="project" />
        <div v-if="empty" class="no-projects">
            <h1>Welcome to Lode.</h1>
            <button class="btn btn-primary" @click="add">Add your first project</button>
        </div>
        <Project
            v-if="project"
            :project="project"
            :key="project.id"
        />
        <ModalController />
    </div>
</template>

<script>
import { Project as ProjectModel } from '@lib/frameworks/project'

import { mapGetters } from 'vuex'
import Titlebar from '@/components/Titlebar'
import ModalController from '@/components/ModalController'
import Project from '@/components/Project'

export default {
    name: 'Index',
    components: {
        Titlebar,
        ModalController,
        Project
    },
    data () {
        return {
            empty: null,
            project: null
        }
    },
    computed: {
        ...mapGetters({
            currentProject: 'config/currentProject'
        })
    },
    watch: {
        currentProject (value) {
            this.updateProject()
        }
    },
    created () {
        this.updateProject()
    },
    methods: {
        updateProject () {
            this.empty = !this.currentProject
            this.project = this.empty ? null : new ProjectModel(this.currentProject)
        },
        add () {
            this.$modal.confirm('AddProject')
                .then(() => {
                    this.$nextTick(() => {
                        this.$modal.open('AddRepositories', { project: this.project })
                    })
                })
                .catch(() => {})
        }
    }
}
</script>
