import FrameworkError from '@/components/modals/FrameworkError'

export default class Modals {
    install (Vue) {
        Vue.prototype.$modal = this

        Vue.component('FrameworkError', FrameworkError)
    }

    constructor (store) {
        this.store = store
    }

    open (name, properties = {}, callback = null) {
        this.store.dispatch('modal/open', { name, properties, callback })
    }

    confirm (name, properties = {}, callback = null) {
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
