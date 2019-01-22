import Vue from 'vue'
import store from './store'
import { mapActions, mapGetters } from 'vuex'
import { ipcRenderer } from 'electron'
import { Config } from '@lib/config'
import { Project } from '@lib/frameworks/project'

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
            currentProject: 'config/currentProject'
        })
    },
    watch: {
        currentProject (value) {
            this.$modal.clear()
            this.refreshProject()
            this.emitProjectChange()
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
                    case 'new-project':
                        this.addProject()
                        break
                    case 'switch-project':
                        this.switchProject(properties)
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
                        this.$store.dispatch('config/logSettings')
                        break
                    case 'reset-settings':
                        this.$modal.confirm('ResetSettings')
                            .then(() => {
                                this.$store.dispatch('config/reset')
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
                    this.emitProjectChange()
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
        emitProjectChange () {
            ipcRenderer.send('project-changed', {
                project: this.project,
                projects: Config.get('projects')
            })
        },
        ...mapActions({
            switchProject: 'config/switchProject',
            removeProject: 'config/removeProject'
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
