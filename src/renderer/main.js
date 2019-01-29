import Vue from 'vue'
import store from './store'
import { mapActions, mapGetters } from 'vuex'
import { remote, ipcRenderer } from 'electron'
import { Config } from '@lib/config'
import { Logger } from '@lib/logger'
import { Project } from '@lib/frameworks/project'
import { queue } from '@lib/process/queue'

// Styles
import '../styles/app.scss'

// Plugins and directives
import Icons from './plugins/icons'
import Modals from './plugins/modals'
import Alerts from './plugins/alerts'
import Strings from './plugins/strings'
import Input from './plugins/input'
import Filters from './plugins/filters'
import Markdown from './directives/markdown'

// Global / recursive components
import App from '@/components/App'
import Test from '@/components/Test'

Vue.config.productionTip = false

// Register plugins
Vue.use(new Icons())
Vue.use(new Modals(store))
Vue.use(new Alerts(store))
Vue.use(new Strings('en-US'))
Vue.use(new Input())
Vue.use(new Filters())

// Register directives
Vue.directive('markdown', Markdown(Vue))

// Register global or recursive components
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
    computed: {
        ...mapGetters({
            currentProject: 'projects/currentProject'
        })
    },
    watch: {
        currentProject (value) {
            this.$modal.clear()
            this.refreshProject()
            this.updateApplicationMenu()
        }
    },
    created () {
        this.refreshProject()

        // Register ipcRenderer event handling
        ipcRenderer
            .on('blur', () => {
                document.body.classList.remove('is-focused')
            })
            .on('focus', () => {
                document.body.classList.add('is-focused')
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
                        this.confirmRemoveProject()
                        break
                    case 'add-repositories':
                        this.addRepositories()
                        break
                    case 'log-settings':
                        Logger.info.log({
                            object: Config.get(),
                            json: JSON.stringify(Config.get())
                        })
                        break
                    case 'reset-settings':
                        this.$modal.confirm('ResetSettings')
                            .then(() => {
                                Config.clear()
                                remote.getCurrentWindow().reload()
                            })
                            .catch(() => {})
                        break
                }
            })
    },
    methods: {
        refreshProject () {
            this.project = !this.currentProject ? null : new Project(this.currentProject)
        },
        addProject () {
            this.$modal.confirm('EditProject')
                .then(() => {
                    this.$nextTick(() => {
                        this.addRepositories()
                    })
                })
                .catch(() => {})
        },
        editProject () {
            this.$modal.confirm('EditProject', { project: this.project })
                .then(() => {
                    // Since current project hasn't changed, just been updated,
                    // we need to forcibly emit the change to the main process,
                    // so that the application menu gets updated.
                    this.updateApplicationMenu()
                })
                .catch(() => {})
        },
        confirmRemoveProject () {
            this.$modal.confirm('RemoveProject')
                .then(() => {
                    this.removeProject()
                })
                .catch(() => {})
        },
        addRepositories () {
            this.$modal.open('AddRepositories', { project: this.project })
        },
        updateApplicationMenu () {
            ipcRenderer.send('update-menu', {
                latestJobName: queue.getLatestJobName()
            })
        },
        switchProject (projectId) {
            // Clicking on current project doesn't have any effect.
            if (projectId === this.project.id) {
                return false
            }

            this.$modal.confirmIf(() => {
                return this.project.status === 'idle' ? false : Config.get('confirm.switchProject')
            }, 'ConfirmSwitchProject')
                .then(disableConfirm => {
                    if (disableConfirm) {
                        Config.set('confirm.switchProject', false)
                    }
                    this.project.stop().then(() => {
                        this.handleSwitchProject(projectId)
                    })
                })
                .catch(() => {})
        },
        latest (name, job) {
            queue.latest(name, job)
            this.updateApplicationMenu()
        },
        ...mapActions({
            handleSwitchProject: 'projects/switchProject',
            removeProject: 'projects/removeProject'
        })
    },
    store,
    render (createElement) {
        return createElement(App, {
            props: {
                project: this.project
            }
        })
    }
}).$mount('#app')
