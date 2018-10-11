import octicons from 'octicons'
import Icon from '@/components/Icon'

export default {
    install (Vue) {
        Vue.prototype.$icon = octicons
        Vue.component('Icon', Icon)
    }
}
