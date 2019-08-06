import BaseStrings from '@lib/helpers/strings'

export default class Strings {
    constructor (locale) {
        this.locale = locale
    }

    install (Vue, options) {
        Vue.prototype.$string = new BaseStrings(this.locale)
    }
}
