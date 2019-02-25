<template>
    <main :class="{ 'no-repositories': project.empty() }">
        <div v-if="project.empty()">
            <h2>{{ 'Add repositories to :0 to start testing.' | set(project.name) }}</h2>
            <button class="btn btn-primary" @click="$modal.open('AddRepositories', { project })">Add repositories</button>
        </div>
        <template v-else>
            <div v-if="loading" class="loading">
                <div class="loading-group">
                    <div class="spinner"></div>
                    <h2>{{ 'Loading :0…' | set(project.name) }}</h2>
                </div>
            </div>
            <Split v-if="!loading">
                <Pane>
                    <div class="project">
                        <Repository
                            v-for="repository in project.repositories"
                            :model="repository"
                            :key="repository.getId()"
                            @remove="removeRepository"
                        />
                    </div>
                </Pane>
                <Pane id="results">
                    <Results :test="$root.active.test" />
                </Pane>
            </Split>
        </template>
    </main>
</template>

<script>
import Pane from '@/components/Pane'
import Repository from '@/components/Repository'
import Results from '@/components/Results'
import Split from '@/components/Split'

export default {
    name: 'Project',
    components: {
        Pane,
        Repository,
        Results,
        Split
    },
    props: {
        project: {
            type: Object,
            required: true
        }
    },
    data () {
        return {
            loading: true
        }
    },
    created () {
        this.project.on('ready', () => {
            this.loading = false
        })
    },
    methods: {
        removeRepository (repository) {
            this.$root.onModelRemove(repository.getId())
            this.project.removeRepository(repository.getId())
            this.project.save()
        }
    }
}
</script>
