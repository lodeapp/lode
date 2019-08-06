import BaseTranslation from '@lib/helpers/translation'

export default class Translation {
    install (Vue, options) {
        Vue.prototype.$trans = new BaseTranslation()
    }
}
