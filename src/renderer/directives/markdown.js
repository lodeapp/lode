import _castArray from 'lodash/castArray'

export default function (Vue) {
    return {
        inserted: function (el, binding, vnode) {
            let text = ''
            // If set modifier is present, use value as replacers
            if (binding.modifiers.set) {
                text = Vue.prototype.$string.set(el.innerText || el.textContent, ..._castArray(binding.value))
            } else if (binding.modifiers.plural) {
                text = Vue.prototype.$string.plural(el.innerText || el.textContent, binding.value)
            } else {
                text = binding.value || el.innerText || el.textContent
            }

            el.innerHTML = binding.modifiers.inline
                ? Vue.prototype.$string.markdownInline(text)
                : Vue.prototype.$string.markdown(text, binding.arg)
        }
    }
}
