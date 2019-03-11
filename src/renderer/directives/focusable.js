export default {
    inserted: function (el, binding, vnode) {
        if (binding.value) {
            el.tabIndex = 0
        }
    }
}
