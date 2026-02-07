import { createStore } from 'vuex'

// Load all modules automatically
const moduleFiles = import.meta.glob('./modules/*.js', { eager: true })
const modules = {}
for (const path in moduleFiles) {
    const name = path.replace(/^\.\/modules\/(.+)\.js$/, '$1')
    modules[name] = moduleFiles[path].default
}

export default createStore({
    modules,
    strict: true,
})
