import BaseDurations from '@lib/helpers/durations'

export default class Durations {
    constructor (locale = 'en-US') {
        this.locale = locale
    }

    install (Vue, options) {
        Vue.prototype.$duration = new BaseDurations(this.locale)
    }
}
