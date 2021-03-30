export default class Alerts {
    constructor (store) {
        this.store = store
    }

    install (app) {
        app.config.globalProperties.$alert = this
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
