import { ipcRenderer } from 'electron'
import Vue from 'vue'
import Vuex from 'vuex'

// Load all modules automatically
const context = require.context('@/store/modules', true, /\.js$/)
const modules = {}
context.keys().forEach((key) => {
    modules[key.replace(/^\.\/([aA0-zZ9]+)\.js$/, '$1')] = context(key).default
})

Vue.use(Vuex)

const store = new Vuex.Store({
    modules,
    strict: __DEV__
})

ipcRenderer.on('project-saved', options => {
    store.commit('project/UPDATE', options)
})

export default store
