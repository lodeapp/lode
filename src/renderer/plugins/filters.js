export default {
    install (Vue) {
        Vue.filter('lowercase', (value) => {
            return value.toLowerCase()
        })

        Vue.filter('uppercase', (value) => {
            return value.toUpperCase()
        })

        Vue.filter('truncate', (value, limit, omission) => {
            return Vue.prototype.$string.truncate(value, limit, omission)
        })

        Vue.filter('ucwords', (value) => {
            return Vue.prototype.$string.ucwords(value)
        })

        Vue.filter('set', function () {
            return Vue.prototype.$string.set(...arguments)
        })

        Vue.filter('plural', function (value, amount) {
            return Vue.prototype.$string.plural(value, amount)
        })

        Vue.filter('capitalize', (value) => {
            return Vue.prototype.$string.capitalize(value)
        })

        Vue.filter('bytes', (value, format) => {
            return Vue.prototype.$string.bytes(value)
        })
    }
}
