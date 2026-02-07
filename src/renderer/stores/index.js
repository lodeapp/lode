const modules = import.meta.glob(['./*.js', '!./index.js'], { eager: true })
const stores = {}
for (const path in modules) {
    Object.assign(stores, modules[path])
}
export default stores
