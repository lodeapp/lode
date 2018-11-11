export default class Modals {
    install (Vue) {
        Vue.prototype.$alert = this
    }

    constructor (store) {
        this.store = store
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
