import type { App, State } from 'vue'
import type { Store } from 'vuex'

export default class Alerts {
    private store: Store<State>

    constructor (store: Store<State>) {
        this.store = store
    }

    install (app: App) {
        app.config.globalProperties.$alert = this
    }

    show (alert: any) {
        this.store.dispatch('alert/show', alert)
    }

    hide () {
        this.store.dispatch('alert/hide')
    }

    clear () {
        this.store.dispatch('alert/clear')
    }
}
