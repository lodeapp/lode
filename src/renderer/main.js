import Vue from 'vue'
import axios from 'axios'
import App from './App'
import router from './router'
import store from './store'
import icons from './plugins/icons'
import Strings from './plugins/strings'
import filters from './plugins/filters'

import '../styles/app.scss'

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.http = Vue.prototype.$http = axios
Vue.config.productionTip = false

Vue.use(icons)
Vue.use(new Strings('en-US'))
Vue.use(filters)

// Register global or recursive components
import Test from '@/components/Test'
Vue.component('Test', Test)

/* eslint-disable no-new */
new Vue({
    components: { App },
    router,
    store,
    template: '<App/>'
}).$mount('#app')
