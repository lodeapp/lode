import Vue from 'vue'
import Vuex from 'vuex'

// Load all modules automatically
const context = require.context('@/store/modules', true, /\.js$/)
const modules = {}
context.keys().forEach((key) => {
    modules[key.replace(/^\.\/([aA0-zZ9]+)\.js$/, '$1')] = context(key).default
})

Vue.use(Vuex)

export default new Vuex.Store({
    modules,
    strict: true
})
