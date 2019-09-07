import BaseDurations from '@lib/helpers/durations'

export default class Durations {
    constructor (locale) {
        this.locale = locale
    }

    install (Vue, options) {
        Vue.prototype.$duration = new BaseDurations(this.locale)
    }
}
