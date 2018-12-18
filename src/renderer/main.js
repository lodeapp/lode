import Vue from 'vue'
import axios from 'axios'
import App from './App'
import router from './router'
import store from './store'

// Plugins and directives
import Events from './plugins/events'
import Icons from './plugins/icons'
import Queue from './plugins/queue'
import Modals from './plugins/modals'
import Alerts from './plugins/alerts'
import Strings from './plugins/strings'
import Filters from './plugins/filters'
import Markdown from './directives/markdown'

// Global / recursive components
import Test from '@/components/Test'

// Styles
import '../styles/app.scss'

Vue.http = Vue.prototype.$http = axios
Vue.config.productionTip = false

// Register ipcRendered event handling
Vue.use(new Events(store))

Vue.use(new Icons())
Vue.use(new Queue())
Vue.use(new Modals(store))
Vue.use(new Alerts(store))
Vue.use(new Strings('en-US'))
Vue.use(new Filters())

Vue.directive('markdown', Markdown(Vue))

// Register global or recursive components
Vue.component('Test', Test)

/* eslint-disable no-new */
new Vue({
    components: { App },
    router,
    store,
    template: '<App/>'
}).$mount('#app')
