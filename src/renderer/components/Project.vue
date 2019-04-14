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
                    <h5 class="sidebar-header">
                        <span>Repositories</span>
                        <button type="button" class="sidebar-action" @click="this.$root.addRepositories">
                            <Icon symbol="plus" />
                        </button>
                    </h5>
                    <SidebarRepository
                        v-for="repository in $root.project.repositories"
                        :repository="repository"
                        :key="repository.getId()"
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
        }
    },
    created () {
        let initialFramework = null
        let initialRepository = null
        this.$root.project.on('ready', () => {
            this.$root.project.repositories.forEach(repository => {
                if (!initialRepository) {
                    initialRepository = repository
                }

                repository.frameworks.forEach(framework => {
                    if (!initialFramework || framework.isActive()) {
                        initialFramework = framework
                        initialRepository = repository
                    }

                    framework.on('error', (error, process) => {
                        this.$alert.show({
                            message: this.$string.set('The process for **:0** terminated unexpectedly.', framework.name),
                            help: framework.troubleshoot(error),
                            type: 'error',
                            error
                        })
                    })

                    framework.on('suiteRemoved', suite => {
                        this.$root.onModelRemove(suite.getId())
                    })
                })
            })

            if (initialRepository) {
                this.repository = initialRepository
            }
            if (initialFramework) {
                this.framework = initialFramework
                if (!this.framework.isActive()) {
                    this.framework.setActive(true)
                }
            }

            this.loading = false
        })
    },
    methods: {
        manageFramework (framework) {
            this.$modal.open('ManageFrameworks', {
                repository: this.repository,
                scanned: false,
                framework
            })
        },
        removeFramework (framework) {
            this.$root.onModelRemove(framework.getId())
            this.repository.removeFramework(framework.getId())
            this.repository.save()
            this.framework = null
        },
        onFrameworkActivation (frameworkId, repository) {
            // Do nothing when clicking on currently active framework
            if (frameworkId === this.framework.getId()) {
                return
            }

            // De-activate all other frameworks.
            this.$root.project.repositories.forEach(repository => {
                repository.frameworks.forEach(framework => {
                    if (framework.getId() !== frameworkId) {
                        framework.setActive(false)
                    }
                })
            })

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
