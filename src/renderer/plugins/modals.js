import _has from 'lodash/has'

export default class Modals {
    constructor () {
        this.modals = []
    }

    install (Vue) {
        Vue.prototype.$modal = this
    }

    add (payload) {
        this.modals.push(payload)
    }

    remove () {
        const modal = this.modals.pop()
        if (_has(modal, 'callback') && modal.callback) {
            modal.callback.call()
        }
    }

    clear () {
        this.modals = []
    }

    onChange () {
        if (this.modals.length) {
            document.body.classList.add('modal-open')
            return
        }
        document.body.classList.remove('modal-open')
    }

    all () {
        return this.modals
    }

    hasModals () {
        return this.modals.length > 0
    }

    open (name, properties = {}, callback = null) {
        this.add({ name, properties, callback })
        this.onChange()
    }

    confirm (name, properties = {}) {
        return new Promise((resolve, reject) => {
            this.add({
                name,
                properties: Object.assign(properties, { resolve, reject })
            })
        })
    }

    close () {
        this.remove()
        this.onChange()
    }
}
