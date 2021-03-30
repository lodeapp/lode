import BaseDurations from '@lib/helpers/durations'

export default class Durations {
    constructor (locale = 'en-US') {
        this.locale = locale
    }

    install (app) {
        app.config.globalProperties.$duration = new BaseDurations(this.locale)
    }
}
