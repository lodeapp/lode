import { useModalsStore } from '../stores/modals'

export default class Modals {
    constructor() {
        this.modals = []
    }

    install(app) {
        app.config.globalProperties.$modal = this
    }

    open(name, properties = {}, callback = null) {
        useModalsStore().open(name)
        this.modals.push({ properties, callback })
    }

    confirm(name, properties = {}) {
        return new Promise((resolve, reject) => {
            useModalsStore().open(name)
            this.modals.push({ properties: { ...properties, resolve, reject } })
        })
    }

    confirmIf(condition, name, properties = {}) {
        if (typeof condition === 'function') {
            condition = condition()
        }
        // If no confirmation is required, return a promise that resolves
        // automatically, for consistency.
        return condition
            ? this.confirm(name, properties)
            : new Promise((resolve) => {
                    resolve()
                })
    }

    close() {
        useModalsStore().close()
        const modal = this.modals.pop()
        if (modal.callback) {
            // Set a timeout before triggering callback in case callback is going
            // to instantiate a similar modal. Not doing so could cause the modal
            // to be cached by Vue, thus not rendering properly (i.e. not calling
            // `created` or `mounted` lifecycle events on the new modal).
            setTimeout(() => {
                modal.callback.call()
            })
        }
    }

    clear() {
        useModalsStore().clear()
        this.modals = []
    }

    getProperties(index) {
        return this.modals[index].properties
    }
}
