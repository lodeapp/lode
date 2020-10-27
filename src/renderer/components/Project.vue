<template>
    <main class="project">
        <template>
            <ProjectLoader
                v-if="loading"
                :name="model.name"
            />
            <Split v-else :class="{ 'empty': !repository || !framework || frameworkLoading || repositoryMissing }">
                <Pane class="sidebar">
                    <div class="draggable"></div>
                    <header>
                        <h5 class="sidebar-header">Project</h5>
                        <div
                            class="sidebar-item has-status"
                            :class="[
                                `status--${status}`,
                                menuActive ? 'is-menu-active' : '',
                            ]"
                            @contextmenu="onContextMenu"
                        >
                            <div class="header">
                                <div class="title">
                                    <Indicator :status="status" />
                                    <h4 class="heading">
                                        <span class="name" :title="model.name">
                                            {{ model.name }}
                                        </span>
                                    </h4>
                                </div>
                            </div>
                        </div>
                        <h5 v-if="repositories.length" class="sidebar-header">
                            <span>Repositories</span>
                            <button type="button" class="sidebar-action" @click="this.$root.repositoryAdd">
                                <Icon symbol="plus" />
                            </button>
                        </h5>
                    </header>
                    <section>
                        <div class="shadow"></div>
                        <div class="shadow-overlay"></div>
                        <SidebarRepository
                            v-for="repository in repositories"
                            :model="repository"
                            :key="repository.id"
                            @status="onRepositoryStatus"
                            @framework-activate="onFrameworkActivation"
                        />
                    </section>
                </Pane>
                <Pane id="list">
                    <div class="draggable"></div>
                    <template v-if="!repositories.length">
                        <div class="cta">
                            <h2>{{ 'Add repositories to :0' | set(model.name) }}</h2>
                            <p>Lode can have multiple repositories and frameworks inside a project.</p>
                            <button class="btn btn-primary" @click="this.$root.repositoryAdd">Add repositories</button>
                        </div>
                    </template>
                    <template v-else-if="!framework">
                        <div class="cta">
                            <h2>Scan for frameworks inside your repositories</h2>
                            <p>Lode can scan the project's repositories for testing frameworks. If none are found, your frameworks may not be supported, yet.</p>
                            <button class="btn btn-primary" @click="$root.scanEmptyRepositories">Scan for frameworks</button>
                        </div>
                    </template>
                    <template v-else-if="repositoryMissing && repository">
                        <div class="cta">
                            <h2>Lode can't find "{{ repository.name }}"</h2>
                            <p v-markdown>It was last seen at `{{ repository.path }}`.</p>
                            <button class="btn btn-primary" @click="$root.repositoryLocate(repository)">Locate</button>
                            <button class="btn" @click="$root.repositoryRemove(repository)">Remove</button>
                            <button class="btn" @click="$root.repositoryExists(repository)">Check again</button>
                        </div>
                    </template>
                    <template v-else>
                        <div v-if="frameworkLoading" class="loading">
                            <div class="loading-group">
                                <div class="spinner"></div>
                            </div>
                        </div>
                        <Framework
                            v-if="framework"
                            v-show="!frameworkLoading"
                            :key="$string.from([frameworkKey, framework.id])"
                            :model="framework"
                            @activate="onTestActivation"
                            @mounted="frameworkLoading = false"
                        />
                    </template>
                </Pane>
                <Pane id="results">
                    <div class="draggable"></div>
                    <Results
                        v-if="framework"
                        v-show="!repositoryMissing && !frameworkLoading"
                        :key="framework.id"
                        :context="fullContext"
                    />
                </Pane>
            </Split>
        </template>
    </main>
</template>

<script>
import _findIndex from 'lodash/findIndex'
import { mapGetters } from 'vuex'
import { ipcRenderer } from 'electron'
import Pane from '@/components/Pane'
import ProjectLoader from '@/components/ProjectLoader'
import SidebarRepository from '@/components/SidebarRepository'
import Indicator from '@/components/Indicator'
import Framework from '@/components/Framework'
import Results from '@/components/Results'
import Split from '@/components/Split'
import HasStatus from '@/components/mixins/HasStatus'

export default {
    name: 'Project',
    components: {
        Pane,
        ProjectLoader,
        SidebarRepository,
        Indicator,
        Framework,
        Results,
        Split
    },
    mixins: [
        HasStatus
    ],
    props: {
        model: {
            type: Object,
            required: true
        }
    },
    data () {
        return {
            context: [],
            loading: true,
            frameworkLoading: true,
            frameworkKey: this.$string.random(),
            menuActive: false,
            repositories: [],
            persistContext: {}
        }
    },
    computed: {
        fullContext () {
            return [this.repository, this.framework].concat(this.context)
        },
        repositoryMissing () {
            return this.repository && this.repository.status === 'missing'
        },
        ...mapGetters({
            repository: 'context/repository',
            framework: 'context/framework'
        })
    },
    created () {
        ipcRenderer
            .on('repositories', this.onRepositoriesEvent)
            .on('framework-active', this.onFrameworkActive)
            .on('framework-updated', this.onFrameworkUpdated)
            .on('framework-options-updated', this.onFrameworkOptionsUpdated)

        this.getRepositories()
    },
    beforeDestroy () {
        ipcRenderer
            .removeListener('repositories', this.onRepositoriesEvent)
            .removeListener('framework-active', this.onFrameworkActive)
            .removeListener('framework-updated', this.onFrameworkUpdated)
            .removeListener('framework-options-updated', this.onFrameworkOptionsUpdated)
    },
    methods: {
        getRepositories () {
            ipcRenderer.send('project-repositories', {
                id: this.model.id,
                name: this.model.name
            })
        },
        async onRepositoriesEvent (event, payload) {
            this.$payload(payload, async repositories => {
                this.repositories = repositories
                this.loading = false
            })
        },
        onRepositoryStatus (to, from, repository) {
            const index = _findIndex(this.repositories, ['id', repository.id])
            if (index) {
                this.repositories[index].status = to
                if (this.repository && this.repository.id === repository.id) {
                    this.$store.commit('context/REPOSITORY', this.repositories[index])
                }
            }
        },
        async onFrameworkActive (event, payload) {
            this.$payload(payload, (framework, repository) => {
                this.$store.dispatch('context/activate', { framework, repository })
            })
        },
        async onFrameworkUpdated (event, payload) {
            this.$payload(payload, framework => {
                if (this.framework.id === framework.id) {
                    this.$store.commit('context/FRAMEWORK', framework)
                }
            })
        },
        async onFrameworkOptionsUpdated (event, payload) {
            this.frameworkLoading = true
            await this.onFrameworkUpdated(event, payload)
            this.frameworkKey = this.$string.random()
        },
        async onFrameworkActivation (frameworkId, repository) {
            this.frameworkLoading = true
            this.$root.repositoryExists(repository)
            this.$store.dispatch('context/activateWithId', { frameworkId, repository })

            // @TODO: new means of checking if repository exist...
            // Check if repository still exists before proceeding, but continue
            // even if it does not so we can better handle changes or relocation.
            // repository.exists()

            // @TODO: persist context, if necessary
            // If there's currently an active test, remember it.
            // if (this.context.length) {
            //     this.persistContext[this.framework.id] = this.context.map(context => context.id || context.file)
            // }
            // this.resetContext()
            // this.$store.commit('context/CLEAR')

            // @TODO: persist context, if necessary
            // Activate the test previously active for this framework.
            // if (this.persistContext[frameworkId]) {
            //     this.$store.commit('context/SET', this.persistContext[frameworkId])
            // }
            // this.repository = repository
            // this.framework = framework

            // this.onRepositoryChanged()
        },
        // @TODO: redo test activation
        onTestActivation (context) {
        },
        onContextMenu () {
            this.menuActive = true
            ipcRenderer.invoke('project-context-menu').finally(() => {
                this.menuActive = false
            })
        }
    }
}
</script>
