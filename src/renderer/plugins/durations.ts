import type { App } from 'vue'
import BaseDurations from '@lib/helpers/durations'

export default class Durations {
    private locale: string

    constructor (locale: string = 'en-US') {
        this.locale = locale
    }

    install (app: App) {
        app.config.globalProperties.$duration = new BaseDurations(this.locale)
    }
}
