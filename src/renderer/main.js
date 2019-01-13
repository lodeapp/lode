import Vue from 'vue'
import store from './store'
import { mapGetters } from 'vuex'
import { ipcRenderer } from 'electron'
import { Project } from '@lib/frameworks/project'

// Styles
import '../styles/app.scss'

// Plugins and directives
import Icons from './plugins/icons'
import Queue from './plugins/queue'
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
Vue.use(new Queue())
Vue.use(new Modals())
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
            this.refreshProject()
        }
    },
    created () {
        this.refreshProject()

        // Register ipcRendered event handling
        ipcRenderer
            .on('blur', () => {
                document.body.classList.remove('is-focused')
            })
            .on('focus', () => {
                document.body.classList.add('is-focused')
            })
            .on('menu-event', (event, { name }) => {
                switch (name) {
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
            this.$modal.confirm('AddProject')
                .then(() => {
                    this.$nextTick(() => {
                        this.$modal.open('AddRepositories', { project: this.project })
                    })
                })
                .catch(() => {})
        }
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
