export default class Alerts {
    constructor (store) {
        this.store = store
    }

    install (Vue) {
        Vue.prototype.$alert = this
    }

    show (alert) {
        this.store.dispatch('alert/show', alert)
    }

    hide () {
        this.store.dispatch('alert/hide')
    }

    clear () {
        this.store.dispatch('alert/clear')
    }
}
