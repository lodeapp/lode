import Vue from 'vue'
import store from './store'
import { get } from 'lodash'
import { clipboard, remote, ipcRenderer, shell } from 'electron'
import { state } from '@main/lib/state'
import { Logger } from '@main/lib/logger'
import { Project } from '@main/lib/frameworks/project'
import { queue } from '@main/lib/process/queue'

// Styles
import '../styles/app.scss'

// Plugins
import Alerts from './plugins/alerts'
import Filesystem from './plugins/filesystem'
import Filters from './plugins/filters'
import Highlight from './plugins/highlight'
import Input from './plugins/input'
import Modals from './plugins/modals'
import Strings from './plugins/strings'

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
Vue.use(new Highlight())
Vue.use(new Input())
Vue.use(new Modals(store))
Vue.use(new Strings('en-US'))

// Register directives
Vue.directive('markdown', Markdown(Vue))
Vue.directive('focusable', Focusable)

// Register global or recursive components
Vue.component('Icon', Icon)
Vue.component('Test', Test)

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
    created () {
        this.loadProject(remote.getCurrentWindow().getProjectOptions())

        ipcRenderer
            .on('blur', () => {
                document.body.classList.remove('is-focused')
            })
            .on('focus', () => {
                document.body.classList.add('is-focused')
            })
            .on('close', () => {
                // @TODO: disassemble is not synchronous. Make sure it has
                // finished running before green-lighting closing of window.
                this.project.stop().then(() => {
                    ipcRenderer.send('window-should-close')
                })
            })
            .on('project-switched', (event, projectOptions) => {
                this.loadProject(projectOptions)
                try {
                    if (global.gc) {
                        global.gc()
                    }
                } catch (error) {
                    // ...
                }
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
                    case 'switch-project':
                        this.switchProject(properties)
                        break
                    case 'select-all':
                        this.selectAll()
                        break
                    case 'run-selected':
                        // @TODO: When we have keyboard navigation, run the
                        // actual selected framework, not the first one.
                        const framework = get(this.project, 'repositories.0.frameworks.0')
                        if (framework) {
                            framework.start()
                        }
                        break
                    case 'run-project':
                        this.latest(
                            this.$string.set(':0 project run', this.project.name),
                            () => this.project.start()
                        )
                        break
                    case 'refresh-project':
                        this.project.refresh()
                        break
                    case 'stop-project':
                        this.project.stop()
                        break
                    case 'rerun-last':
                        queue.runLatest()
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
                        const projectState = state.project(this.projectId)
                        Logger.info.log({
                            object: projectState.get(),
                            json: JSON.stringify(projectState.get())
                        })
                        break
                    case 'log-settings':
                        Logger.info.log({
                            object: state.get(),
                            json: JSON.stringify(state.get())
                        })
                        break
                    case 'crash':
                        this.crash()
                        break
                    case 'feedback':
                        window.location.href = 'mailto:tbuteler@me.com'
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
    methods: {
        loadProject (projectOptions) {
            this.project = projectOptions ? new Project(JSON.parse(projectOptions)) : null
            this.updateApplicationMenu()
        },
        addProject () {
            this.$modal.confirm('EditProject', { add: true })
                .then(options => {
                    // Stop current project before adding a new one.
                    (this.project ? this.project.stop() : Promise.resolve()).then(() => {
                        store.commit('test/CLEAR')
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
                    this.updateApplicationMenu()
                })
                .catch(() => {})
        },
        removeProject () {
            this.$modal.confirm('RemoveProject')
                .then(() => {
                    this.project.stop().then(() => {
                        store.commit('test/CLEAR')
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
            // Clicking on current project doesn't have any effect.
            if (projectId === this.project.getId()) {
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
                        store.commit('test/CLEAR')
                        this.handleSwitchProject(projectId)
                    })
                })
                .catch(() => {})
        },
        handleSwitchProject (projectId) {
            ipcRenderer.send('switch-project', projectId)
        },
        addRepositories () {
            this.$modal.open('AddRepositories')
        },
        updateApplicationMenu () {
            ipcRenderer.send('update-menu', {
                latestJobName: queue.getLatestJobName()
            })
        },
        latest (name, job) {
            queue.latest(name, job)
            this.updateApplicationMenu()
        },
        openExternal (link) {
            shell.openExternal(link)
        },
        async openFile (path) {
            const result = await shell.openExternal(`file://${path}`)

            if (!result) {
                // @TODO: Alert this error
                // const error = {
                //     name: 'no-external-program',
                //     message: `Unable to open file ${path} in an external program. Please check you have a program associated with this file extension`,
                // }
            }
        },
        revealFile (path) {
            shell.showItemInFolder(path)
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
