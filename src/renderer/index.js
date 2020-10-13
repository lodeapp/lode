import '@lib/logger/renderer'
import '@lib/tracker/renderer'

import Vue from 'vue'
import store from './store'
import * as Path from 'path'
import { isArray, isEmpty } from 'lodash'
import { parse } from 'flatted'
import { clipboard, remote, ipcRenderer, shell } from 'electron'

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

Vue.mixin({
    methods: {
        $payload (payload, callback) {
            payload = parse(payload)
            return callback(...payload.args, payload.id)
        }
    }
})

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
            ready: false,
            projectName: null,
            project: null
        }
    },
    created () {
        ipcRenderer
            .on('did-finish-load', (event, payload) => {
                this.$payload(payload, properties => {
                    this.projectName = properties.projectName
                    document.body.classList.add(`platform-${process.platform}`)
                    if (properties.focus) {
                        document.body.classList.add('is-focused')
                    }
                    this.ready = true
                })
            })
            .on('blur', () => {
                document.body.classList.remove('is-focused')
            })
            .on('focus', () => {
                document.body.classList.add('is-focused')
            })
            .on('project-ready', (event, payload) => {
                console.log('PROJECT READY')
                this.$payload(payload, project => {
                    this.loadProject(project)
                })
            })
            .on('settings-updated', (event, payload) => {
                this.$payload(payload, settings => {
                    this.updateSettings(settings)
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
                        ipcRenderer.send('project-refresh')
                        break
                    case 'run-all':
                        ipcRenderer.send('project-start')
                        break
                    case 'stop-all':
                        ipcRenderer.send('project-stop')
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
                    case 'settings-reset':
                        this.$modal.confirm('ResetSettings')
                            .then(() => {
                                ipcRenderer.send('settings-reset')
                            })
                            .catch(() => {})
                        break
                    case 'log-project':
                        log.info(parse(await ipcRenderer.invoke('log-project')))
                        break
                    case 'log-settings':
                        log.info({
                            ...parse(await ipcRenderer.invoke('log-settings')),
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
                this.addRepositories(Array.from(files).map(({ path }) => path))
            }
            e.preventDefault()
        }
    },
    methods: {
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
            console.log('LOADING PROJECT', { project })
            this.$store.commit('filters/RESET')
            this.project = !isEmpty(project) ? project : null
            this.projectName = this.project ? this.project.name : null
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
        async removeProject () {
            this.$modal.confirm('RemoveProject')
                .then(async () => {
                    const switchTo = await ipcRenderer.invoke('project-remove', this.project.id)
                    console.log({ switchTo })
                    this.handleSwitchProject(switchTo)
                })
                .catch(() => {})
        },
        switchProject (projectId) {
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
                    this.handleSwitchProject(projectId)
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
            store.commit('context/CLEAR')
            ipcRenderer.send('project-switch', projectId ? { id: projectId } : null)
        },
        addRepositories (directories) {
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
        scanRepositories (repositories, n) {
            console.log({ repositories, n })
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
        setting (key) {
            return store.getters['settings/value'](key)
        },
        updateSetting (key, value) {
            ipcRenderer.send('settings-update', key, value)
        },
        updateSettings (settings = {}) {
            store.replaceState({
                ...store.state,
                settings
            })
        },
        refreshApplicationMenu () {
            ipcRenderer.send('menu-refresh')
        },
        setApplicationMenuOption (options = {}) {
            ipcRenderer.send('menu-set-options', options)
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
                    .once(`${path}:exists`, (event, payload) => {
                        this.$payload(payload, exists => {
                            resolve(exists)
                        })
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
