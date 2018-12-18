import { ipcRenderer } from 'electron'

export default class Events {
    constructor (store) {
        this.store = store
    }

    install (Vue) {
        ipcRenderer
            .on('blur', () => {
                document.body.classList.remove('is-focused')
            })
            .on('focus', () => {
                document.body.classList.add('is-focused')
            })
            .on('menu-event', (event, { name }) => {
                switch (name) {
                    case 'reset-settings':
                        Vue.prototype.$modal.confirm('ResetSettings')
                            .then(() => {
                                this.store.dispatch('config/reset')
                            })
                            .catch(() => {})
                        break
                }
            })
    }
}
