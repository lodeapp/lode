import BaseStrings from '@lib/helpers/strings'

export default class Strings {
    constructor (locale = 'en-US') {
        this.locale = locale
    }

    install (app) {
        app.config.globalProperties.$string = new BaseStrings(this.locale)
    }
}
