<template>
    <div class="contents">
        <Titlebar :project="project" />
        <div v-if="empty" class="no-projects">
            <h1>Welcome to Lode.</h1>
            <button class="btn btn-primary" @click="$modal.open('AddProject')">Add your first project</button>
        </div>
        <main v-else :class="{ 'no-repositories': !project.repositories.length }">
            <div v-if="!project.repositories.length">
                <h2>{{ 'Add repositories to :0 to start testing.' | set(project.name) }}</h2>
                <button class="btn btn-primary" @click="$modal.open('AddRepositories')">Add repositories</button>
            </div>
            <template v-else>
                <Pane>
                    <Project
                        :project="project"
                        :key="project.id"
                    />
                </Pane>
                <Pane>
                    <Results :test="activeTest" />
                </Pane>
            </template>
        </main>
        <ModalController />
    </div>
</template>

<script>
import { Project as ProjectModel } from '@lib/frameworks/project'

import { mapGetters } from 'vuex'
import Titlebar from '@/components/Titlebar'
import ModalController from '@/components/ModalController'
import Pane from '@/components/Pane'
import Project from '@/components/Project'
import Results from '@/components/Results'

export default {
    name: 'Index',
    components: {
        Titlebar,
        ModalController,
        Pane,
        Project,
        Results
    },
    computed: {
        empty () {
            return !this.currentProject
        },
        project () {
            return this.empty ? null : new ProjectModel(this.currentProject.name, this.currentProject.id)
        },
        ...mapGetters({
            currentProject: 'config/currentProject',
            activeTest: 'tests/active'
        })
    }
}
</script>
