<template>
    <main :class="{ 'no-repositories': $root.project.empty() }">
        <div v-if="$root.project.empty()">
            <h2>{{ 'Add repositories to :0 to start testing.' | set($root.project.name) }}</h2>
            <button class="btn btn-primary" @click="$modal.open('AddRepositories')">Add repositories</button>
        </div>
        <template v-else>
            <div v-if="loading" class="loading">
                <div class="loading-group">
                    <div class="spinner"></div>
                    <h2>{{ 'Loading :0…' | set($root.project.name) }}</h2>
                </div>
            </div>
            <Split v-if="!loading">
                <Pane>
                    <div class="project">
                        <Repository
                            v-for="repository in $root.project.repositories"
                            :repository="repository"
                            :key="repository.getId()"
                            @remove="removeRepository"
                            @activate="onChildActivation"
                        />
                    </div>
                </Pane>
                <Pane id="results">
                    <Results :context="context" />
                </Pane>
            </Split>
        </template>
    </main>
</template>

<script>
import { mapGetters } from 'vuex'
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
    data () {
        return {
            context: [],
            loading: true
        }
    },
    computed: {
        ...mapGetters({
            storeContext: 'context/active'
        })
    },
    watch: {
        // Watch the store context for changes. If it's cleared, we clear local
        // context, too. The store context will hold the model keys so we can
        // watch it globally. Local context will hold the actual reactive models.
        storeContext (context) {
            if (!context.length) {
                this.context = []
            }
        }
    },
    created () {
        this.$root.project.on('ready', () => {
            this.loading = false
        })
    },
    methods: {
        removeRepository (repository) {
            this.$root.onModelRemove(repository.getId())
            this.$root.project.removeRepository(repository.getId())
            this.$root.project.save()
        },
        onChildActivation (context) {
            this.context = context
        }
    }
}
</script>
