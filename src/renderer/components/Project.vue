<template>
    <main class="project">
        <template>
            <div v-if="loading" class="loading">
                <div class="loading-group">
                    <div class="spinner"></div>
                    <h2>{{ 'Loading :0…' | set(model.name) }}</h2>
                </div>
            </div>
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
                        >
                            <div class="header">
                                <div class="title" @contextmenu="openMenu">
                                    <Indicator :status="status" />
                                    <h4 class="heading">
                                        <span class="name" :title="model.name">
                                            {{ model.name }}
                                        </span>
                                    </h4>
                                </div>
                            </div>
                        </div>
                        <h5 v-if="repository" class="sidebar-header">
                            <span>Repositories</span>
                            <button type="button" class="sidebar-action" @click="this.$root.addRepositories">
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
                            @scan="$root.scanRepository"
                            @locate="locateRepository"
                            @remove="removeRepository"
                            @framework-activate="onFrameworkActivation"
                            @framework-manage="manageFramework"
                            @framework-remove="removeFramework"
                        />
                    </section>
                </Pane>
                <Pane id="list">
                    <div class="draggable"></div>
                    <template v-if="!repository">
                        <div class="cta">
                            <h2>{{ 'Add repositories to :0' | set(model.name) }}</h2>
                            <p>Lode can have multiple repositories and frameworks inside a project.</p>
                            <button class="btn btn-primary" @click="this.$root.addRepositories">Add repositories</button>
                        </div>
                    </template>
                    <template v-else-if="!framework">
                        <div class="cta">
                            <h2>Scan for frameworks inside your repositories</h2>
                            <p>Lode can scan the project's repositories for testing frameworks. If none are found, your frameworks may not be supported, yet.</p>
                            <button class="btn btn-primary" @click="scanEmptyRepositories">Scan for frameworks</button>
                        </div>
                    </template>
                    <template v-else-if="repositoryMissing && repository">
                        <div class="cta">
                            <h2>Lode can't find "{{ repository.getDisplayName() }}"</h2>
                            <p v-markdown>It was last seen at `{{ repository.getPath() }}`.</p>
                            <button class="btn btn-primary" @click="locateRepository(repository)">Locate</button>
                            <button class="btn" @click="removeRepository(repository)">Remove</button>
                            <button class="btn" @click="repository.exists()">Check again</button>
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
                            @manage="manageFramework"
                            @remove="removeFramework"
                            @activate="onTestActivation"
                            @mounted="onFrameworkMounted"
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
                        @reset="resetContext"
                    />
                </Pane>
            </Split>
        </template>
    </main>
</template>

<script>
import { ipcRenderer, remote } from 'electron'
import _findIndex from 'lodash/findIndex'
import Pane from '@/components/Pane'
import SidebarRepository from '@/components/SidebarRepository'
import Indicator from '@/components/Indicator'
import Framework from '@/components/Framework'
import Results from '@/components/Results'
import Split from '@/components/Split'
import HasProjectMenu from '@/components/mixins/HasProjectMenu'
import HasStatus from '@/components/mixins/HasStatus'

export default {
    name: 'Project',
    components: {
        Pane,
        SidebarRepository,
        Indicator,
        Framework,
        Results,
        Split
    },
    mixins: [
        HasProjectMenu,
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
            frameworkLoading: false,
            repositories: [],
            repository: null,
            framework: null,
            persistContext: {}
        }
    },
    computed: {
        fullContext () {
            return [this.repository, this.framework].concat(this.context)
        },
        repositoryMissing () {
            return this.repository && this.repository.status === 'missing'
        }
    },
    created () {
        ipcRenderer
            .on('repositories', this.onRepositoriesEvent)

        this.getRepositories()
    },
    beforeDestroy () {
        ipcRenderer
            .removeListener('repositories', this.onRepositoriesEvent)
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
                console.log({ repositories })
                this.repositories = repositories
                await Promise.all(this.repositories.map((repository, index) => {
                    return new Promise((resolve, reject) => {
                        ipcRenderer
                            .once(`${repository.id}:frameworks`, (event, payload) => {
                                this.$payload(payload, frameworks => {
                                    this.repositories[index].frameworks = frameworks
                                    resolve()
                                })
                            })
                            .send('repository-frameworks', repository.id)
                    })
                }))

                this.onProjectChange()
                this.loading = false
            })
        },
        scanEmptyRepositories () {
            this.$root.scanRepositories(
                // Scan repositories which are currently empty.
                this.repositories.filter(repository => !repository.frameworks.length),
                0
            )
        },
        removeRepository (repository) {
            console.log('removing repository', repository)
            // If the repository we're removing is the currently active one,
            // make sure to clear the Vuex context, too
            if (repository.id === this.repository.id) {
                this.resetContext()
                this.$store.commit('context/CLEAR')
                this.repository = null
                this.framework = null
            }

            this.$root.onModelRemove(repository.id)
            ipcRenderer.send('repository-remove', repository.id)
            const index = _findIndex(this.repositories, r => r.id === repository.id)
            if (index > -1) {
                this.repositories.splice(index, 1)
            }
        },
        async locateRepository (repository) {
            remote.dialog.showOpenDialog({
                properties: ['openDirectory', 'multiSelections']
            }).then(({ filePaths }) => {
                if (!filePaths || !filePaths.length) {
                    return
                }

                repository.updatePath(filePaths[0])
            })
        },
        // @TODO: redo error handling
        registerFrameworkListeners (framework) {
            framework
                .on('error', (error, process) => {
                    this.$alert.show({
                        message: this.$string.set('The process for **:0** terminated unexpectedly.', framework.getDisplayName()),
                        help: framework.troubleshoot(error),
                        type: 'error',
                        error
                    })
                })
        },
        onProjectChange () {
            let setRepository = this.repository
            let setFramework = this.framework

            if (!this.repositories.length) {
                this.repository = null
                this.framework = null
            } else {
                this.repositories.forEach(repository => {
                    if (!setRepository) {
                        setRepository = repository
                    }

                    repository.frameworks.forEach(framework => {
                        // @TODO: redo is active
                        // if (!setFramework || framework.isActive()) {
                        if (!setFramework || false) {
                            setFramework = framework
                            setRepository = repository
                        }
                    })
                })

                if (setRepository) {
                    this.repository = setRepository
                    if (setFramework) {
                        this.onFrameworkActivation(setFramework, setRepository)
                        // @TODO: redo is active
                        // if (!this.framework.isActive()) {
                        //     this.framework.setActive(true)
                        // }
                    }
                }
            }

            this.$root.setApplicationMenuOption({
                hasFramework: !!this.framework
            })
        },
        onRepositoryChanged () {
            this.$store.commit('context/REPOSITORY', this.repository ? this.repository.id : '')
        },
        onFrameworkChanged () {
            console.log('framework changed')
            this.$store.commit('context/FRAMEWORK', this.framework ? this.framework.id : '')
            this.frameworkLoading = true
        },
        onFrameworkMounted () {
            this.frameworkLoading = false
        },
        onFrameworkActivation (framework, repository) {
            console.log('activating framework', framework, repository)
            // Do nothing when clicking on currently active framework.
            if (this.framework && framework && this.framework.id === framework.id) {
                return
            }
            // @TODO: new means of checking if repository exist...
            // Check if repository still exists before proceeding, but continue
            // even if it does not so we can better handle changes or relocation.
            // repository.exists()

            // @TODO: persist context, if necessary
            // If there's currently an active test, remember it.
            // if (this.context.length) {
            //     this.persistContext[this.framework.id] = this.context.map(context => context.id || context.file)
            // }
            this.resetContext()
            this.$store.commit('context/CLEAR')

            // @TODO: persist context, if necessary
            // Activate the test previously active for this framework.
            // if (this.persistContext[frameworkId]) {
            //     this.$store.commit('context/SET', this.persistContext[frameworkId])
            // }
            this.repository = repository
            this.framework = framework

            this.onRepositoryChanged()
            this.onFrameworkChanged()
        },
        manageFramework (framework) {
            this.$modal.open('ManageFrameworks', {
                repository: this.repository,
                scan: false,
                framework
            })
        },
        removeFramework (frameworkId) {
            console.log('removing framework')
            this.$root.removeFramework(this.repository.id, frameworkId)
        },
        onTestActivation (context) {
            this.context = context
        },
        resetContext () {
            this.context = []
        }
    }
}
</script>
