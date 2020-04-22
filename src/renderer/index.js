import '@lib/logger/renderer'
import '@lib/tracker/renderer'

import Vue from 'vue'
import store from './store'
import * as Path from 'path'
import { isArray, pickBy } from 'lodash'
import { mapGetters } from 'vuex'
import { clipboard, remote, ipcRenderer, shell } from 'electron'
import { state } from '@lib/state'
import { Project } from '@lib/frameworks/project'
import { Titlebar, Color } from 'custom-electron-titlebar'

// Styles
import '../styles/app.scss'
import 'overlayscrollbars/css/OverlayScrollbars.css'

// Plugins
import Alerts from './plugins/alerts'
import Filesystem from './plugins/filesystem'
import Filters from './plugins/filters'
import Code from './plugins/code'
import Input from './plugins/input'
import Modals from './plugins/modals'
import Strings from './plugins/strings'
import Durations from './plugins/durations'

// Directives
import Markdown from './directives/markdown'
import Focusable from './directives/focusable'

// Global / recursive components
import App from '@/components/App'
import Test from '@/components/Test'
import Icon from '@/components/Icon'

Vue.config.productionTip = false

// Register plugins
Vue.use(new Alerts(store))
Vue.use(new Filesystem())
Vue.use(new Filters())
Vue.use(new Code())
Vue.use(new Input())
Vue.use(new Modals(store))
Vue.use(new Strings())
Vue.use(new Durations())

// Register directives
Vue.directive('markdown', Markdown(Vue))
Vue.directive('focusable', Focusable)

// Register global or recursive components
Vue.component('Icon', Icon)
Vue.component('Test', Test)

if (process.env.NODE_ENV !== 'development') {
    window.__static = Path.join(__dirname, '/static').replace(/\\/g, '\\\\')
}

export default new Vue({
    components: {
        App
    },
    data () {
        return {
            modals: []
        }
    },
    computed: {
        progress () {
            // @TODO: redo progress calculation
            // return this.project ? this.project.getProgress() : -1
            return -1
        },
        ...mapGetters({
            project: 'project/project'
        })
    },
    watch: {
        progress (value) {
            remote.getCurrentWindow().setProgressBar(this.project.getProgress())
        }
    },
    created () {
        this.titlebar()
        this.loadProject(remote.getCurrentWindow().getProjectOptions())

        ipcRenderer
            .on('did-finish-load', () => {
                document.body.classList.add(`platform-${process.platform}`)
                if (remote.getCurrentWindow().isFocused()) {
                    document.body.classList.add('is-focused')
                }
            })
            .on('blur', () => {
                document.body.classList.remove('is-focused')
            })
            .on('focus', () => {
                document.body.classList.add('is-focused')
            })
            .on('close', () => {
                // Disassemble is not synchronous. We're giving a small timeout
                // to increase the lieklihood it's finished before green-lighting
                // the closing of the window, but this is not guaranteed.
                this.project.stop().then(() => {
                    setTimeout(() => {
                        ipcRenderer.send('window-should-close')
                    }, 10)
                })
            })
            .on('project-switched', (event, projectOptions) => {
                this.loadProject(projectOptions)
                this.gc()
            })
            .on('status', (event, id, status) => {
                this.$store.dispatch('status/set', { id, status })
            })
            .on('menu-event', (event, { name, properties }) => {
                switch (name) {
                    case 'show-about':
                        this.$modal.open('About')
                        break
                    case 'show-preferences':
                        this.$modal.open('Preferences')
                        break
                    case 'new-project':
                        this.addProject()
                        break
                    case 'project-switch':
                        this.switchProject(properties)
                        break
                    case 'select-all':
                        this.selectAll()
                        break
                    case 'refresh-all':
                        this.project.refresh()
                        break
                    case 'run-all':
                        this.project.start()
                        break
                    case 'stop-all':
                        this.project.stop()
                        break
                    case 'rename-project':
                        this.editProject()
                        break
                    case 'remove-project':
                        this.removeProject()
                        break
                    case 'add-repositories':
                        this.addRepositories()
                        break
                    case 'log-project':
                        const projectState = state.project(this.project.getId())
                        log.info({
                            project: {
                                object: this.project,
                                string: JSON.stringify(this.project)
                            },
                            state: {
                                json: projectState.get(),
                                string: JSON.stringify(projectState.get())
                            }
                        })
                        break
                    case 'log-settings':
                        log.info({
                            object: state.get(),
                            json: JSON.stringify(state.get())
                        })
                        break
                    case 'crash':
                        this.crash()
                        break
                    case 'feedback':
                        window.location.href = 'mailto:support@lode.run'
                        break
                    case 'reset-settings':
                        this.$modal.confirm('ResetSettings')
                            .then(() => {
                                ipcRenderer.sendSync('reset-settings')
                                remote.getCurrentWindow().reload()
                            })
                            .catch(() => {})
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
                this.addRepositories(Array.from(files).map(({ path }) => path))
            }
            e.preventDefault()
        }
    },
    methods: {
        titlebar () {
            if (__WIN32__) {
                const titlebar = new Titlebar({
                    backgroundColor: Color.fromHex('#ffffff'),
                    icon: 'static/icons/gem.svg',
                    overflow: 'hidden'
                })
                document.title = ''
                titlebar.updateTitle()

                ipcRenderer
                    .on('menu-updated', () => {
                        titlebar.updateMenu(remote.Menu.getApplicationMenu())
                    })
            }
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
            console.log(pickBy)
            project = JSON.parse(project)
            const compactTests = nugget => {
                nugget.tests = (nugget.tests || []).map(compactTests)
                return pickBy(nugget, property => {
                    return property && !!property.length
                })
            }
            project.repositories = project.repositories.map(repository => {
                repository.frameworks = repository.frameworks.map(framework => {
                    framework.suites = framework.suites.map(suite => {
                        suite.tests = suite.tests.map(compactTests)
                        return pickBy(suite, property => {
                            return property && !!property.length
                        })
                    })
                    return framework
                })
                return repository
            })
            this.$store.replaceState({
                ...this.$store.state,
                ...{ status: {
                    ...this.$store.state.status,
                    ...{ status: this.mapStatuses(project) }
                }},
                project
            })
            this.refreshApplicationMenu()
        },
        addProject () {
            this.$modal.confirm('EditProject', { add: true })
                .then(options => {
                    // Stop current project before adding a new one.
                    (this.project ? this.project.stop() : Promise.resolve()).then(() => {
                        store.commit('context/CLEAR')
                        const project = new Project(options)
                        ipcRenderer.once('project-switched', () => {
                            this.addRepositories()
                        })
                        this.handleSwitchProject(project.getId())
                    })
                })
                .catch(() => {})
        },
        editProject () {
            this.$modal.confirm('EditProject')
                .then(options => {
                    this.project.updateOptions(options)
                    this.project.save()

                    // Since current project hasn't changed, just been updated,
                    // we need to forcibly emit the change to the main process,
                    // so that the application menu gets updated.
                    this.refreshApplicationMenu()
                })
                .catch(() => {})
        },
        removeProject () {
            this.$modal.confirm('RemoveProject')
                .then(() => {
                    this.project.stop().then(() => {
                        store.commit('context/CLEAR')
                        const switchTo = state.removeProject(this.project.getId())
                        // Switch information should be available only
                        // if there are still projects to switch to.
                        if (switchTo) {
                            this.handleSwitchProject(switchTo)
                        } else {
                            this.loadProject(null)
                        }
                    })
                })
                .catch(() => {})
        },
        switchProject (projectId) {
            // Clicking on current project shouldn't have any effect.
            if (projectId === this.project.getId()) {
                // Windows will uncheck the project regardless of it being
                // selected already, so refresh the menu to undo it.
                if (__WIN32__) {
                    this.refreshApplicationMenu()
                }
                return false
            }

            this.$modal.confirmIf(() => {
                return this.project.status === 'idle' ? false : state.get('confirm.switchProject')
            }, 'ConfirmSwitchProject')
                .then(disableConfirm => {
                    if (disableConfirm) {
                        state.set('confirm.switchProject', false)
                    }
                    this.project.stop().then(() => {
                        store.commit('context/CLEAR')
                        this.handleSwitchProject(projectId)
                    })
                })
                .catch(() => {
                    // Windows will check the project regardless of
                    // confirmation, so refresh the menu to undo it.
                    if (__WIN32__) {
                        this.refreshApplicationMenu()
                    }
                })
        },
        handleSwitchProject (projectId) {
            ipcRenderer.send('project-switch', projectId)
        },
        addRepositories (directories) {
            if (!isArray(directories)) {
                directories = null
            }
            this.$modal.confirm('AddRepositories', { directories })
                .then(({ repositories, autoScan }) => {
                    if (autoScan) {
                        this.scanRepositories(repositories.map(repository => repository.getId()), 0)
                    }
                })
                .catch(() => {})
        },
        scanRepositories (repositoryIds, index) {
            const id = repositoryIds[index]
            const repository = this.project.getRepositoryById(id)
            if (!repository) {
                return
            }
            // Scan repository and queue the following one the modal callback.
            this.scanRepository(repository, () => {
                this.scanRepositories(repositoryIds, (index + 1))
            })
        },
        scanRepository (repository, callback = null) {
            if (!repository.exists()) {
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
        refreshApplicationMenu () {
            ipcRenderer.send('refresh-menu')
        },
        setApplicationMenuOption (options = {}) {
            ipcRenderer.send('set-menu-options', options)
        },
        openExternal (link) {
            shell.openExternal(link)
        },
        async openFile (path) {
            try {
                await shell.openExternal(`file://${path}`)
            } catch (_) {
                this.$alert.show({
                    message: 'Unable to open file in an external program. Please check you have a program associated with this file extension.',
                    help: 'The following path was attempted: `' + path + '`',
                    type: 'error'
                })
            }
        },
        revealFile (path) {
            ipcRenderer.send('show-item-in-folder', path)
        },
        copyToClipboard (string) {
            clipboard.writeText(string)
        },
        selectAll () {
            const event = new CustomEvent('select-all', {
                bubbles: true,
                cancelable: true
            })

            if (document.activeElement.dispatchEvent(event)) {
                remote.getCurrentWebContents().selectAll()
            }
        },
        crash () {
            window.setImmediate(() => {
                throw new Error('Boomtown!')
            })
        },
        gc () {
            try {
                if (global.gc) {
                    global.gc()
                }
            } catch (error) {
                // ...
            }
        },
        onModelRemove (modelId) {
            store.dispatch('context/onRemove', modelId)
        }
    },
    store,
    render (createElement) {
        return createElement(App)
    }
}).$mount('#app')
