<template>
    <div id="wrapper">
        <main>
            <div v-if="project">
                <Project :project="project" />
                <ResultsPane :test="activeTest" />
            </div>
        </main>
    </div>
</template>

<script>
import { mapGetters } from 'vuex'
import Project from '@/components/Project'
import { Project as ProjectModel } from '@lib/frameworks/project'
import ResultsPane from '@/components/ResultsPane'

export default {
    name: 'Index',
    components: {
        Project,
        ResultsPane
    },
    data () {
        return {
            project: null
        }
    },
    computed: {
        ...mapGetters({
            activeTest: 'tests/active'
        })
    },
    created () {
        this.project = new ProjectModel()
    }
}
</script>
