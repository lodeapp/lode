export default class Metrics {
    install (Vue, options) {
        Vue.prototype.$metrics = this
    }
    event (category, action, label = null, value = null, fields = {}) {
        if (typeof window.ga === 'undefined') {
            if (typeof console !== 'undefined') {
                console.log('Tracking event', { category, action, label, value, fields })
            }
            return false
        }
        window.ga('send', 'event', category, action, label, value, fields)
    }
}
