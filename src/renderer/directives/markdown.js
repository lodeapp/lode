import _castArray from 'lodash/castArray'

// Use an object for each binding so we can store original templates
// in case dynamic content changes and we need to re-compute markup.
class MarkdownDirective {
    constructor (Vue, el, binding) {
        this.vm = Vue
        this.template = (binding.modifiers.set ? false : binding.value) || el.innerText || el.textContent
    }

    html (el, binding) {
        let text = this.template
        // If set modifier is present, use value as replacers
        if (binding.modifiers.set) {
            text = this.vm.prototype.$string.set(this.template, ..._castArray(binding.value))
        } else if (binding.modifiers.plural) {
            text = this.vm.prototype.$string.plural(this.template, binding.value)
        }

        return binding.modifiers.block
            ? this.vm.prototype.$string.markdownBlock(text, true)
            : this.vm.prototype.$string.markdown(text)
    }
}

export default function (Vue) {
    return {
        bind (el, binding, vnode) {
            el.markdown = new MarkdownDirective(Vue, el, binding)
            el.innerHTML = el.markdown.html(el, binding)
        },
        componentUpdated (el, binding, vnode) {
            el.innerHTML = el.markdown.html(el, binding)
        }
    }
}
