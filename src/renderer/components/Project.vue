<template>
    <main class="project">
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
                        :key="framework.id"
                        :model="framework"
                        @activate="onTestActivation"
                        @mounted="frameworkLoading = false"
                    />
                </template>
            </Pane>
            <Pane id="results">
                <div class="draggable"></div>
                <template v-if="framework && !repositoryMissing">
                    <div v-if="!context.length" class="results blankslate">
                        <h3>No test selected</h3>
                    </div>
                    <Results
                        v-else-if="!frameworkLoading"
                        :key="$string.from(context)"
                        :context="context"
                    />
                </template>
            </Pane>
        </Split>
    </main>
</template>

<script>
import _findIndex from 'lodash/findIndex'
import { mapGetters } from 'vuex'
import Pane from '@/components/Pane'
import ProjectLoader from '@/components/ProjectLoader'
import SidebarRepository from '@/components/SidebarRepository'
import Indicator from '@/components/Indicator'
import Framework from '@/components/Framework'
import Results from '@/components/Results'
import Split from '@/components/Split'

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
    props: {
        model: {
            type: Object,
            required: true
        }
    },
    data () {
        return {
            loading: true,
            frameworkLoading: true,
            frameworkKey: this.$string.random(),
            status: this.model.status || 'idle',
            menuActive: false,
            repositories: [],
            persistContext: {}
        }
    },
    computed: {
        context () {
            if (!this.framework || this.frameworkLoading) {
                return []
            }
            return [this.framework.id].concat(this.nuggets)
        },
        repositoryMissing () {
            return this.repository && this.repository.status === 'missing'
        },
        ...mapGetters({
            repository: 'context/repository',
            framework: 'context/framework',
            nuggets: 'context/nuggets'
        })
    },
    mounted () {
        Lode.ipc
            .on(`${this.model.id}:status:sidebar`, this.statusListener)
            .on(`${this.model.id}:repositories`, this.onRepositoriesEvent)
            .on('framework-active', this.onFrameworkActive)
            .on('framework-options-updated', this.onFrameworkOptionsUpdated)

        this.getRepositories()
    },
    beforeDestroy () {
        Lode.ipc
            .removeAllListeners(`${this.model.id}:status:sidebar`)
            .removeAllListeners(`${this.model.id}:repositories`)
            .removeAllListeners('framework-active')
            .removeAllListeners('framework-options-updated')
    },
    methods: {
        getRepositories () {
            Lode.ipc.send('project-repositories', {
                id: this.model.id,
                name: this.model.name
            })
        },
        statusListener (event, to, from) {
            this.status = to
        },
        async onRepositoriesEvent (event, repositories) {
            this.repositories = repositories
            this.loading = false
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
        async onFrameworkOptionsUpdated (event, framework) {
            this.frameworkLoading = true
            if (this.framework.id === framework.id) {
                this.$store.commit('context/FRAMEWORK', framework)
                this.frameworkKey = this.$string.random()
            }
        },
        async onFrameworkActive (event, frameworkId, repository) {
            if (!frameworkId) {
                this.$store.commit('context/CLEAR')
            } else if (!this.framework || this.framework.id !== frameworkId) {
                this.onFrameworkActivation(frameworkId, repository)
            }
        },
        async onFrameworkActivation (frameworkId, repository) {
            this.frameworkLoading = true
            this.$root.repositoryExists(repository)
            this.$store.dispatch('context/activate', { frameworkId, repository })
        },
        onTestActivation (nuggets) {
            this.$store.commit('context/SET_NUGGETS', nuggets)
        },
        onContextMenu () {
            this.menuActive = true
            Lode.ipc.invoke('project-context-menu').finally(() => {
                this.menuActive = false
            })
        }
    }
}
</script>
