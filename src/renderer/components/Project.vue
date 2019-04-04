<template>
    <main class="project" :class="{ 'no-repositories': $root.project.empty() }">
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
            <Split v-else>
                <Pane class="sidebar">
                    <h5>Project</h5>
                    <div class="sidebar-item has-status" :class="[`status--${$root.project.status}`]">
                        <div class="header">
                            <div class="title">
                                <Indicator :status="$root.project.status" />
                                <h4 class="heading">
                                    <span class="name" :title="$root.project.name">
                                        {{ $root.project.name }}
                                    </span>
                                </h4>
                            </div>
                        </div>
                    </div>
                    <h5>Repositories</h5>
                    <Repository
                        v-for="repository in $root.project.repositories"
                        :repository="repository"
                        :key="repository.getId()"
                        :initial="framework.getId()"
                        @activate="onFrameworkActivation($event, repository)"
                    />
                </Pane>
                <Pane>
                    <div v-if="frameworkLoading" class="loading">
                        <div class="loading-group">
                            <div class="spinner"></div>
                        </div>
                    </div>
                    <Framework
                        v-show="!frameworkLoading"
                        :key="framework.getId()"
                        :framework="framework"
                        @remove="removeFramework"
                        @manage="manageFramework"
                        @activate="onTestActivation"
                        @mounted="frameworkLoading = false"
                    />
                </Pane>
                <Pane id="results">
                    <Results
                        :context="fullContext"
                        @reset="resetContext"
                    />
                </Pane>
            </Split>
        </template>
    </main>
</template>

<script>
import _get from 'lodash/get'
import _last from 'lodash/last'
import Pane from '@/components/Pane'
import Repository from '@/components/Repository'
import Indicator from '@/components/Indicator'
import Framework from '@/components/Framework'
import Results from '@/components/Results'
import Split from '@/components/Split'

export default {
    name: 'Project',
    components: {
        Pane,
        Repository,
        Indicator,
        Framework,
        Results,
        Split
    },
    data () {
        return {
            context: [],
            loading: true,
            frameworkLoading: false,
            repository: null,
            framework: null,
            persistActiveTests: {}
        }
    },
    computed: {
        fullContext () {
            return [this.repository, this.framework].concat(this.context)
        }
    },
    created () {
        this.$root.project.on('ready', () => {
            // TODO: Search for first available framework, unless a previous
            // selection is known. Repository is chosen according to framework,
            // not the other way around.
            this.repository = _get(this.$root.project, 'repositories.0')
            this.framework = _get(this.repository, 'frameworks.0')
            this.loading = false
        })
    },
    methods: {
        removeRepository (repository) {
            // TODO: Remove repository
            this.$root.onModelRemove(repository.getId())
            this.$root.project.removeRepository(repository.getId())
            this.$root.project.save()
        },
        removeFramework (framework) {
            this.$root.onModelRemove(framework.getId())
            this.repository.removeFramework(framework.getId())
            this.repository.save()
        },
        manageFramework (framework) {
            this.$modal.open('ManageFrameworks', {
                repository: this.repository,
                scanned: false,
                framework
            })
        },
        onTestActivation (context) {
            this.context = context
        },
        onFrameworkActivation (frameworkId, repository) {
            // If there's currently an active test, remember it.
            if (this.context.length) {
                this.persistActiveTests[this.framework.getId()] = _last(this.context).getId()
            }
            this.resetContext()
            this.$store.commit('test/CLEAR')
            this.frameworkLoading = true
            setTimeout(() => {
                this.repository = repository
                this.framework = this.repository.getFrameworkById(frameworkId)
                // Activate the test previously active for this framework.
                if (this.persistActiveTests[frameworkId]) {
                    this.$store.commit('test/SET', this.persistActiveTests[frameworkId])
                }
            }, 10)
        },
        resetContext () {
            this.context = []
        }
    }
}
</script>
