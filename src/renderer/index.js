import '@lib/logger/renderer'
import '@lib/tracker/renderer'

import Vue from 'vue'
import store from './store'
import * as Path from 'path'
import { isArray, isEmpty } from 'lodash'
import { clipboard, remote, ipcRenderer, shell } from 'electron'
import { state } from '@lib/state'
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
import Icon from '@/components/Icon'
import Nugget from '@/components/Nugget'

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
Vue.component('Nugget', Nugget)

if (process.env.NODE_ENV !== 'development') {
    window.__static = Path.join(__dirname, '/static').replace(/\\/g, '\\\\')
}

export default new Vue({
    components: {
        App
    },
    data () {
        return {
            modals: [],
            project: null
        }
    },
    computed: {
        progress () {
            // @TODO: redo progress calculation
            // return this.project ? this.project.getProgress() : -1
            return -1
        }
    },
    watch: {
        progress (value) {
            remote.getCurrentWindow().setProgressBar(this.project.getProgress())
        }
    },
    created () {
        this.titlebar()

        ipcRenderer
            .on('did-finish-load', (event, properties) => {
                document.body.classList.add(`platform-${process.platform}`)
                if (properties.focus) {
                    document.body.classList.add('is-focused')
                }
                this.loadProject(properties.projectOptions)
            })
            .on('blur', () => {
                document.body.classList.remove('is-focused')
            })
            .on('focus', () => {
                document.body.classList.add('is-focused')
            })
            .on('project-switched', (event, projectOptions) => {
                this.loadProject(projectOptions)
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
                                ipcRenderer.send('reset-settings')
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
            project = JSON.parse(project)
            this.project = isEmpty(project) ? null : project
            this.refreshApplicationMenu()
        },
        addProject () {
            this.$modal.confirm('EditProject', { add: true })
                .then(identifier => {
                    ipcRenderer.once('project-switched', () => {
                        this.addRepositories()
                    })
                    ipcRenderer.send('project-switch', identifier)
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
                    repositories = JSON.parse(repositories)
                    this.project.repositories = repositories
                    if (autoScan) {
                        this.scanRepositories(repositories, 0)
                    }
                })
                .catch(() => {})
        },
        scanRepositories (repositories, n) {
            // Scan repository and queue the following one the modal callback.
            this.scanRepository(repositories[n], () => {
                if ((n + 1) >= repositories.length) {
                    return
                }
                this.scanRepositories(repositories, (n + 1))
            })
        },
        async scanRepository (repository, callback = null) {
            const exists = await this.fileExists(repository.path)
            if (!exists) {
                // @TODO: update the repository to mark it doesn't exist
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
        async removeFramework (repositoryId, frameworkId) {
            this.onModelRemove(frameworkId)
            ipcRenderer.send('framework-remove', {
                repository: repositoryId,
                framework: frameworkId
            })
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
        async fileExists (path) {
            return new Promise((resolve, reject) => {
                ipcRenderer
                    .once(`${path}:exists`, (event, exists) => {
                        resolve(exists)
                    })
                    .send('check-if-file-exists', path)
            })
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
        onModelRemove (modelId) {
            store.dispatch('context/onRemove', modelId)
        }
    },
    store,
    render (createElement) {
        return createElement(App)
    }
}).$mount('#app')
