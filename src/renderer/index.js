import '@lib/logger/renderer'

import { createApp, h } from 'vue'
import store from './store'
import { isArray, isEmpty } from 'lodash'

// Styles
import '../styles/app.scss'

// Plugins
import Alerts from './plugins/alerts'
import Code from './plugins/code'
import Input from './plugins/input'
import Modals from './plugins/modals'
import Strings from './plugins/strings'
import Durations from './plugins/durations'
import Unproxy from './plugins/unproxy'

// Directives
import Markdown from './directives/markdown'

// Global / recursive components
import App from '@/components/App.vue'
import Icon from '@/components/Icon.vue'
import Nugget from '@/components/Nugget.vue'

const app = createApp({
    components: {
        App
    },
    data () {
        return {
            version: '',
            arch: '',
            nodeVersion: '',
            modals: [],
            ready: false,
            translated: false,
            supportsThemes: false,
            loading: true,
            project: null,
            menu: null
        }
    },
    created () {
        Lode.ipc
            .on('did-finish-load', (event, properties) => {
                this.setTheme(properties.theme)
                document.body.classList.add(`platform-${process.platform}`)
                if (properties.focus) {
                    document.body.classList.add('is-focused')
                }
                if (properties.maximized) {
                    document.body.classList.add('is-maximized')
                }
                if (properties.fullscreen) {
                    document.body.classList.add('is-fullscreen')
                    document.body.classList.add('titlebar-hidden')
                }
                if (!properties.projectId) {
                    this.loading = false
                }
                this.version = properties.version
                this.arch = properties.arch
                this.nodeVersion = properties.nodeVersion
                this.menu = __WIN32__ ? properties.menu : null
                this.translated = properties.runningUnderARM64Translation
                this.supportsThemes = properties.supportsThemes

                this.ready = true

                if (this.translated) {
                    setTimeout(() => {
                        this.handleAppRunningInTranslation()
                    }, 10)
                }
            })
            .on('blur', () => {
                document.body.classList.remove('is-focused')
            })
            .on('focus', () => {
                document.body.classList.add('is-focused')
            })
            .on('maximize', () => {
                document.body.classList.add('is-maximized')
            })
            .on('unmaximize', () => {
                document.body.classList.remove('is-maximized')
            })
            .on('enter-full-screen', () => {
                document.body.classList.add('is-fullscreen')
                document.body.classList.add('titlebar-hidden')
            })
            .on('leave-full-screen', () => {
                document.body.classList.remove('is-fullscreen')
                document.body.classList.remove('titlebar-hidden')
            })
            .on('theme-updated', (event, newTheme) => {
                this.setTheme(newTheme)
            })
            .on('project-ready', (event, project) => {
                this.loadProject(project)
            })
            .on('project-loading-failed', (event, id) => {
                this.$modal.confirm('ProjectLoadingFailed')
                    .then(async () => {
                        await Lode.ipc.invoke('project-remove', id)
                    })
                    .catch(() => {})
            })
            .on('settings-updated', (event, settings) => {
                this.updateSettings(settings)
            })
            .on('clear', () => {
                this.loadProject()
            })
            .on('error', (event, message, help) => {
                this.$alert.show({
                    type: 'error',
                    message,
                    help
                })
            })
            .on('menu-event', async (event, { name, properties }) => {
                switch (name) {
                    case 'show-about':
                        this.$modal.open('About')
                        break
                    case 'show-preferences':
                        this.$modal.open('Preferences')
                        break
                    case 'project-add':
                        this.projectAdd()
                        break
                    case 'project-switch':
                        this.projectSwitch(properties)
                        break
                    case 'project-edit':
                        this.projectEdit()
                        break
                    case 'project-remove':
                        this.projectRemove()
                        break
                    case 'repository-add':
                        this.repositoryAdd()
                        break
                    case 'repository-manage':
                        this.repositoryManage(properties)
                        break
                    case 'repository-scan':
                        this.repositoryScan(properties)
                        break
                    case 'repository-remove':
                        this.repositoryRemove(properties)
                        break
                    case 'framework-remove':
                        this.frameworkRemove(properties)
                        break
                    case 'filter':
                        const filter = app._container.querySelector('[type="search"]')
                        filter.focus()
                        if (properties) {
                            filter.value = properties
                            filter.dispatchEvent(new Event('input'))
                        }
                        break
                    case 'select-all':
                        this.selectAll()
                        break
                    case 'settings-reset':
                        this.$modal.confirm('ResetSettings')
                            .then(() => {
                                this.handleProjectSwitch()
                                Lode.ipc.send('settings-reset')
                            })
                            .catch(() => {})
                        break
                    case 'log-project':
                        log.info(await Lode.ipc.invoke('log-project'))
                        break
                    case 'log-settings':
                        log.info({
                            ...await Lode.ipc.invoke('log-settings'),
                            vuex: store.getters['settings/value']()
                        })
                        break
                    case 'log-renderer-state':
                        log.info(store.state)
                        break
                    case 'crash':
                        this.crash()
                        break
                    case 'feedback':
                        window.location.href = 'mailto:support@lode.run'
                        break
                }
            })
    },
    mounted () {
        document.ondragover = e => {
            if (e.dataTransfer != null) {
                e.dataTransfer.dropEffect = store.getters['modals/hasModals'] ? 'none' : 'copy'
            }
            e.preventDefault()
        }

        document.ondrop = e => {
            e.preventDefault()
        }

        document.body.ondrop = e => {
            if (store.getters['modals/hasModals']) {
                return
            }
            if (e.dataTransfer != null) {
                const files = e.dataTransfer.files
                this.repositoryAdd(Array.from(files).map(({ path }) => path))
            }
            e.preventDefault()
        }
    },
    methods: {
        setTheme (theme) {
            document.documentElement.setAttribute('data-color-mode', theme)
            this.$store.commit('theme/SET', theme)
        },
        mapStatuses (project) {
            const mapTests = (nugget, statuses) => {
                (nugget.tests || []).forEach(test => {
                    statuses[test.id] = null
                    mapTests(test, statuses)
                })
            }
            const statuses = {
                [project.id]: null
            }
            project.repositories.forEach(repository => {
                statuses[repository.id] = null
                repository.frameworks.forEach(framework => {
                    statuses[framework.id] = null
                    framework.suites.forEach(suite => {
                        statuses[suite.file] = null
                        mapTests(suite, statuses)
                    })
                })
            })

            return statuses
        },
        loadProject (project) {
            this.$store.commit('filters/RESET')
            this.project = !isEmpty(project) ? project : null
            this.refreshApplicationMenu()
            this.loading = false

            // Register project listeners
            if (this.project) {
                Lode.ipc.on(`${this.project.id}:status:index`, this.projectStatusListener)
            }
        },
        projectStatusListener (event, to, from) {
            this.project.status = to
        },
        async projectAdd () {
            this.$modal.confirm('EditProject', { add: true })
                .then(identifier => {
                    Lode.ipc.once('project-ready', () => {
                        this.repositoryAdd()
                    })
                    this.handleProjectSwitch(identifier)
                })
                .catch(() => {})
        },
        async projectEdit () {
            this.$modal.confirm('EditProject')
                .then(async options => {
                    options = await Lode.ipc.invoke('project-update', options)
                    this.project = options || null

                    // Since current project hasn't changed, just been updated,
                    // we need to forcibly emit the change to the main process,
                    // so that the application menu gets updated.
                    this.refreshApplicationMenu()
                })
                .catch(() => {})
        },
        async projectRemove () {
            this.$modal.confirm('RemoveProject')
                .then(async () => {
                    const switchTo = await Lode.ipc.invoke('project-remove', this.project.id)
                    this.handleProjectSwitch({ id: switchTo })
                })
                .catch(() => {})
        },
        projectSwitch (projectId) {
            // Clicking on current project shouldn't have any effect.
            if (projectId === this.project.id) {
                // Windows will uncheck the project regardless of it being
                // selected already, so refresh the menu to undo it.
                if (__WIN32__) {
                    this.refreshApplicationMenu()
                }
                return false
            }

            this.$modal.confirmIf(() => {
                return ['idle', 'empty', 'loading'].includes(this.project.status)
                    ? false
                    : this.setting('confirm.switchProject')
            }, 'ConfirmSwitchProject')
                .then(disableConfirm => {
                    if (disableConfirm) {
                        this.updateSetting('confirm.switchProject', false)
                    }
                    this.handleProjectSwitch({ id: projectId })
                })
                .catch(() => {
                    // Windows will check the project regardless of
                    // confirmation, so refresh the menu to undo it.
                    if (__WIN32__) {
                        this.refreshApplicationMenu()
                    }
                })
        },
        handleProjectSwitch (identifier) {
            // Before switching, remove project listeners
            if (this.project) {
                Lode.ipc.removeAllListeners(`${this.project.id}:status:index`)
            }
            this.loading = true
            this.project = null
            store.commit('context/CLEAR')
            Lode.ipc.send('project-switch', identifier)
        },
        repositoryAdd (directories) {
            if (!isArray(directories)) {
                directories = null
            }
            this.$modal.confirm('AddRepositories', { directories })
                .then(({ repositories, autoScan }) => {
                    this.project.repositories = repositories
                    if (autoScan) {
                        this.scanRepositories(repositories, 0)
                    }
                })
                .catch(() => {})
        },
        async scanEmptyRepositories () {
            this.scanRepositories(
                await Lode.ipc.invoke('project-empty-repositories'),
                0
            )
        },
        async scanRepositories (repositories, n) {
            // Scan repository and queue the following ones on the modal callback.
            this.repositoryScan(repositories[n], () => {
                if ((n + 1) >= repositories.length) {
                    return
                }

                this.scanRepositories(repositories, (n + 1))
            })
        },
        async repositoryScan (repository, callback = null) {
            const exists = await this.repositoryExists(repository)
            if (!exists) {
                if (callback) {
                    callback()
                }
                return
            }

            this.$modal.open('ManageFrameworks', {
                repository,
                scan: true
            }, callback)
        },
        repositoryManage ({ repository, framework }) {
            this.$modal.open('ManageFrameworks', {
                repository,
                scan: false,
                framework
            })
        },
        repositoryRemove (repository) {
            this.$modal.confirm('RemoveRepository', { repository })
                .then(() => {
                    this.onModelRemove(repository.id)
                    Lode.ipc.send('repository-remove', repository.id)
                })
                .catch(() => {})
        },
        async repositoryLocate (repository) {
            return await Lode.ipc.invoke('repository-locate', repository.id)
        },
        async repositoryExists (repository) {
            return await Lode.ipc.invoke('repository-exists', repository.id)
        },
        async frameworkRemove (framework) {
            this.$modal.confirm('RemoveFramework', { framework })
                .then(() => {
                    this.handleFrameworkRemove(framework.id)
                })
                .catch(() => {})
        },
        handleFrameworkRemove (frameworkId) {
            this.onModelRemove(frameworkId)
            Lode.ipc.send('framework-remove', frameworkId)
        },
        handleAppRunningInTranslation () {
            this.$modal.confirmIf(this.setting('confirm.runningUnderTranslation'), 'RunningUnderTranslation')
                .then(disableConfirm => {
                    if (disableConfirm) {
                        this.updateSetting('confirm.runningUnderTranslation', false)
                    }
                })
                .catch(() => {})
        },
        setting (key) {
            return store.getters['settings/value'](key)
        },
        updateSetting (key, value) {
            Lode.ipc.send('settings-update', key, value)
        },
        updateSettings (settings = {}) {
            store.replaceState({
                ...store.state,
                settings
            })
        },
        refreshApplicationMenu () {
            Lode.ipc.send('menu-refresh')
        },
        openExternal (link) {
            Lode.openExternal(link)
        },
        selectAll () {
            const event = new CustomEvent('select-all', {
                bubbles: true,
                cancelable: true
            })

            if (document.activeElement.dispatchEvent(event)) {
                Lode.ipc.send('select-all')
            }
        },
        crash () {
            window.setImmediate(() => {
                throw new Error('Boomtown!')
            })
        },
        onModelRemove (modelId) {
            store.dispatch('context/onRemove', modelId)
        }
    },
    render () {
        return h(App)
    }
})

// Register plugins
app.use(new Alerts(store))
app.use(new Code())
app.use(new Input())
app.use(new Modals(store))
app.use(new Strings())
app.use(new Durations())
app.use(new Unproxy())

// Register directives
app.directive('markdown', Markdown())

// Register global or recursive components
app.component('Icon', Icon)
app.component('Nugget', Nugget)

app.use(store)

app.mount('#app')

export default app
