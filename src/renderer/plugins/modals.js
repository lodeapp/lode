export default class Modals {
    constructor (store) {
        this.store = store
    }

    install (Vue) {
        Vue.prototype.$modal = this
    }

    open (name, properties = {}, callback = null) {
        this.store.dispatch('modal/open', { name, properties, callback })
    }

    confirm (name, properties = {}) {
        return new Promise((resolve, reject) => {
            this.store.dispatch('modal/open', {
                name,
                properties: Object.assign(properties, { resolve, reject })
            })
        })
    }

    close () {
        this.store.dispatch('modal/close')
    }

    clear () {
        this.store.dispatch('modal/clear')
    }
}
