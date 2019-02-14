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
                        :model="repository"
                        :key="repository.id"
                        @remove="removeRepository"
                        @change="storeRepositoryState"
                    />
                </div>
            </Pane>
            <Pane>
                <Results :test="$root.active.test" />
            </Pane>
        </template>
    </main>
</template>

<script>
import { mapActions } from 'vuex'
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
    methods: {
        removeRepository (repository) {
            this.$root.onModelRemove(repository.id)
            this.project.removeRepository(repository.id)
            this.handleRemoveRepository(repository)
        },
        storeRepositoryState (repository) {
            this.repositoryChange(repository)
        },
        ...mapActions({
            handleRemoveRepository: 'projects/removeRepository',
            repositoryChange: 'projects/repositoryChange'
        })
    }
}
</script>
