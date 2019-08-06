export default class Filters {
    install (Vue) {
        Vue.filter('truncate', (value, limit, omission) => {
            return Vue.prototype.$string.truncate(value, limit, omission)
        })

        Vue.filter('set', function () {
            return Vue.prototype.$string.set(...arguments)
        })

        Vue.filter('plural', function (value, amount) {
            return Vue.prototype.$string.plural(value, amount)
        })

        Vue.filter('bytes', (value, format) => {
            return Vue.prototype.$string.bytes(value)
        })
    }
}
