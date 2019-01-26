export default class Modals {
    constructor (store) {
        this.store = store
        this.modals = []
    }

    install (Vue) {
        Vue.prototype.$modal = this
    }

    open (name, properties = {}, callback = null) {
        this.store.dispatch('modals/open', name)
        this.modals.push({ properties, callback })
    }

    confirm (name, properties = {}) {
        return new Promise((resolve, reject) => {
            this.store.dispatch('modals/open', name)
            this.modals.push({ properties: { ...properties, ...{ resolve, reject }}})
        })
    }

    confirmIf (condition, name, properties = {}) {
        if (typeof condition === 'function') {
            condition = condition()
        }
        // If no confirmation is required, return a promise that resolves
        // automatically, for consistency.
        return condition ? this.confirm(name, properties) : new Promise((resolve, reject) => {
            resolve()
        })
    }

    close () {
        this.store.dispatch('modals/close')
        const modal = this.modals.pop()
        if (modal.callback) {
            modal.callback.call()
        }
    }

    clear () {
        this.store.dispatch('modals/clear')
        this.modals = []
    }

    getProperties (index) {
        return this.modals[index].properties
    }
}
