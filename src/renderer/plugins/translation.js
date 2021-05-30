import BaseTranslation from '@lib/helpers/translation'

export default class Translation {
    install (app) {
        app.config.globalProperties.$trans = new BaseTranslation()
    }
}
