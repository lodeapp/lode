<template>
    <div class="contents">
        <main>
            <Pane>
                <Project :project="project" />
            </Pane>
            <Pane>
                <Results :test="activeTest" />
            </Pane>
        </main>
    </div>
</template>

<script>
import { Project as ProjectModel } from '@lib/frameworks/project'

import { mapGetters } from 'vuex'
import Pane from '@/components/Pane'
import Project from '@/components/Project'
import Results from '@/components/Results'

export default {
    name: 'Index',
    components: {
        Pane,
        Project,
        Results
    },
    data () {
        return {
            project: new ProjectModel()
        }
    },
    computed: {
        ...mapGetters({
            activeTest: 'tests/active'
        })
    }
}
</script>
