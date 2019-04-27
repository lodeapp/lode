<template>
    <main class="project">
        <template>
            <div v-if="loading" class="loading">
                <div class="loading-group">
                    <div class="spinner"></div>
                    <h2>{{ 'Loading :0…' | set($root.project.name) }}</h2>
                </div>
            </div>
            <Split :class="{ 'empty': noRepositories || emptyStatus || frameworkLoading }" v-else>
                <Pane class="sidebar">
                    <h5 class="sidebar-header">Project</h5>
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
                    <h5 v-if="!noRepositories" class="sidebar-header">
                        <span>Repositories</span>
                        <button type="button" class="sidebar-action" @click="this.$root.addRepositories">
                            <Icon symbol="plus" />
                        </button>
                    </h5>
                    <SidebarRepository
                        v-for="repository in $root.project.repositories"
                        :repository="repository"
                        :key="repository.getId()"
                        @scan="$root.scanRepository"
                        @remove="removeRepository"
                    >
                        <div
                            v-for="framework in repository.frameworks"
                            :key="framework.getId()"
                            class="sidebar-item sidebar-item--framework has-status"
                            :class="[
                                `status--${framework.status}`,
                                framework.isActive() ? 'is-active' : ''
                            ]"
                        >
                            <SidebarFramework
                                :framework="framework"
                                @activate="onFrameworkActivation($event, repository)"
                                @manage="manageFramework"
                                @remove="removeFramework"
                            />
                        </div>
                    </SidebarRepository>
                </Pane>
                <Pane>
                    <template v-if="noRepositories">
                        <div class="cta">
                            <h2>{{ 'Add repositories to :0' | set($root.project.name) }}</h2>
                            <p>Lode can have multiple repositories and frameworks inside a project.</p>
                            <button class="btn btn-primary" @click="this.$root.addRepositories">Add repositories</button>
                        </div>
                    </template>
                    <template v-else-if="emptyStatus">
                        <div class="cta">
                            <h2>Scan for frameworks inside your repositories</h2>
                            <p>Lode can scan the project's repositories for testing frameworks. If none are found, your frameworks may not be supported, yet.</p>
                            <button class="btn btn-primary" @click="scanEmptyRepositories">Scan for frameworks</button>
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
                            :key="framework.getId()"
                            :framework="framework"
                            @manage="manageFramework"
                            @remove="removeFramework"
                            @activate="onTestActivation"
                            @mounted="onFrameworkMounted"
                        />
                    </template>
                </Pane>
                <Pane id="results">
                    <Results
                        v-if="framework"
                        v-show="!frameworkLoading"
                        :key="framework.getId()"
                        :context="fullContext"
                        @reset="resetContext"
                    />
                </Pane>
            </Split>
        </template>
    </main>
</template>

<script>
import Pane from '@/components/Pane'
import SidebarRepository from '@/components/SidebarRepository'
import SidebarFramework from '@/components/SidebarFramework'
import Indicator from '@/components/Indicator'
import Framework from '@/components/Framework'
import Results from '@/components/Results'
import Split from '@/components/Split'

export default {
    name: 'Project',
    components: {
        Pane,
        SidebarRepository,
        SidebarFramework,
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
            persistContext: {}
        }
    },
    computed: {
        fullContext () {
            return [this.repository, this.framework].concat(this.context)
        },
        noRepositories () {
            return this.$root.project.empty()
        },
        emptyStatus () {
            return this.$root.project.repositories.length === this.$root.project.repositories.filter(repository => {
                return !repository.frameworks.length
            }).length
        }
    },
    created () {
        this.$root.project.on('ready', () => {
            // Register initial listeners once the project is fully built.
            // Subsequent listeners will be registered when the appropriate
            // events are emitted. All listeners are purged from the parent
            // model when a child is removed.
            this.$root.project.on('repositoryAdded', this.onRepositoryAdded)
            this.$root.project.repositories.forEach(repository => {
                repository.on('frameworkAdded', this.onFrameworkAdded)
                repository.frameworks.forEach(framework => {
                    this.registerFrameworkListeners(framework)
                })
            })
            // Trigger project change to mount default model.
            this.onProjectChange()
            this.loading = false
        })
    },
    methods: {
        scanEmptyRepositories () {
            this.$root.scanRepositories(
                // Scan repositories which are currently empty.
                this.$root.project.repositories
                    .filter(repository => !repository.frameworks.length)
                    .map(repository => repository.getId()),
                0
            )
        },
        removeRepository (repository) {
            this.$root.onModelRemove(repository.getId())
            this.$root.project.removeRepository(repository.getId())
            this.$root.project.save()
            this.onProjectChange()
        },
        manageFramework (framework) {
            this.$modal.open('ManageFrameworks', {
                repository: this.repository,
                scan: false,
                framework
            })
        },
        removeFramework (frameworkId) {
            // If the framework we're removing is the currently active one,
            // make sure to clear the Vuex context, too
            if (frameworkId === this.framework.getId()) {
                this.resetContext()
                this.$store.commit('context/CLEAR')
            }
            this.repository.removeFramework(frameworkId)
            this.repository.save()
            this.framework = null
            delete this.persistContext[frameworkId]
            this.onProjectChange()
        },
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
                .on('suiteRemoved', suiteId => {
                    this.$root.onModelRemove(suiteId)
                })
        },
        clearActiveFrameworks (except = null) {
            this.$root.project.repositories.forEach(repository => {
                repository.frameworks.forEach(framework => {
                    if (framework.getId() !== except) {
                        framework.setActive(false)
                    }
                })
            })
        },
        onProjectChange () {
            let setRepository = this.repository
            let setFramework = this.framework

            if (!this.$root.project.repositories.length) {
                this.clearActiveFrameworks()
                this.repository = null
                this.framework = null
            } else {
                this.$root.project.repositories.forEach(repository => {
                    if (!setRepository) {
                        setRepository = repository
                    }

                    repository.frameworks.forEach(framework => {
                        if (!setFramework || framework.isActive()) {
                            setFramework = framework
                            setRepository = repository
                        }
                    })
                })

                if (setRepository) {
                    this.repository = setRepository
                }
                if (setFramework) {
                    this.framework = setFramework
                    if (!this.framework.isActive()) {
                        this.framework.setActive(true)
                    }
                }
            }

            this.$root.setApplicationMenuOption({
                hasFramework: !!this.framework
            })
        },
        onRepositoryAdded (repository) {
            repository.on('frameworkAdded', this.onFrameworkAdded)
            this.onProjectChange()
        },
        onFrameworkAdded (framework) {
            this.registerFrameworkListeners(framework)
            framework.setActive(true)
            this.clearActiveFrameworks(framework.getId())
            this.onProjectChange()
        },
        onFrameworkMounted () {
            this.frameworkLoading = false
        },
        onFrameworkActivation (frameworkId, repository) {
            // Do nothing when clicking on currently active framework
            if (frameworkId === this.framework.getId()) {
                return
            }

            this.clearActiveFrameworks(frameworkId)

            // If there's currently an active test, remember it.
            if (this.context.length) {
                this.persistContext[this.framework.getId()] = this.context.map(context => context.getId())
            }
            this.resetContext()
            this.$store.commit('context/CLEAR')
            this.frameworkLoading = true
            setTimeout(() => {
                // Activate the test previously active for this framework.
                if (this.persistContext[frameworkId]) {
                    this.$store.commit('context/SET', this.persistContext[frameworkId])
                }
                // Only update repository and framework components
                // once context has been set.
                this.$nextTick(() => {
                    this.repository = repository
                    this.framework = this.repository.getFrameworkById(frameworkId)
                    this.$root.gc()
                })
            }, 10)
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
