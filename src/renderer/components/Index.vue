<template>
    <div class="contents">
        <Titlebar :project="project" />
        <main v-if="empty">
            Empty state for projects...
        </main>
        <main v-else>
            <Pane>
                <Project
                    :project="project"
                    :key="project.id"
                />
            </Pane>
            <Pane>
                <Results :test="activeTest" />
            </Pane>
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
    data () {
        return {
            project: {},
            empty: false
        }
    },
    computed: {
        ...mapGetters({
            currentProject: 'config/currentProject',
            activeTest: 'tests/active'
        })
    },
    created () {
        const current = this.currentProject
        if (!current) {
            this.empty = true
            return
        }
        this.project = new ProjectModel(current.id)
    }
}
</script>
