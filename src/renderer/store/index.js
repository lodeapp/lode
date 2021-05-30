import { createStore } from 'vuex'

// Load all modules automatically
const context = require.context('@/store/modules', true, /\.js$/)
const modules = {}
context.keys().forEach((key) => {
    modules[key.replace(/^\.\/([aA0-zZ9]+)\.js$/, '$1')] = context(key).default
})

export default createStore({
    modules,
    strict: true
})
