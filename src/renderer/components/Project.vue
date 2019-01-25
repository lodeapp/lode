<template>
    <main :class="{ 'no-repositories': !project.repositories.length }">
        <div v-if="!project.repositories.length">
            <h2>{{ 'Add repositories to :0 to start testing.' | set(project.name) }}</h2>
            <button class="btn btn-primary" @click="$modal.open('AddRepositories', { project })">Add repositories</button>
        </div>
        <template v-else>
            <Pane>
                <div class="project">
                    <Repository
                        v-for="repository in project.repositories"
                        :repository="repository"
                        :key="repository.id"
                        @remove="handleRemoveRepository"
                    />
                </div>
            </Pane>
            <Pane>
                <Results :test="activeTest" />
            </Pane>
        </template>
    </main>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import Pane from '@/components/Pane'
import Repository from '@/components/Repository'
import Results from '@/components/Results'

export default {
    name: 'Project',
    components: {
        Pane,
        Repository,
        Results
    },
    props: {
        project: {
            type: Object,
            required: true
        }
    },
    computed: {
        ...mapGetters({
            activeTest: 'tests/active'
        })
    },
    methods: {
        handleRemoveRepository (repository) {
            this.project.removeRepository(repository.id)
            this.removeRepository(repository)
        },
        ...mapActions({
            removeRepository: 'projects/removeRepository'
        })
    }
}
</script>
