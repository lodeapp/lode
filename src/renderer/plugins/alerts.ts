import type { App } from 'vue'
import { useAlertStore } from '../stores'

export default class Alerts {
    private app!: App

    install(app: App) {
        this.app = app
        app.config.globalProperties.$alert = this
    }

    show(alert: any) {
        useAlertStore().show(alert, this.app.config.globalProperties.$modal)
    }

    hide() {
        useAlertStore().hide()
    }

    clear() {
        useAlertStore().clear()
    }
}
