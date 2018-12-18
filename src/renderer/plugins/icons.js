import octicons from 'octicons'
import Icon from '@/components/Icon'

export default class Icons {
    install (Vue) {
        Vue.prototype.$icon = octicons
        Vue.component('Icon', Icon)
    }
}
