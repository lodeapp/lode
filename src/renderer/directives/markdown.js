import { castArray } from 'lodash'
import Strings from '@lib/helpers/strings'

// Use an object for each binding so we can store original templates
// in case dynamic content changes and we need to re-compute markup.
class MarkdownDirective {
    constructor (helper, el, binding) {
        this.helper = helper
        this.template = (binding.modifiers.set ? false : binding.value) || el.innerText || el.textContent
    }

    html (el, binding) {
        let text = this.template
        // If set modifier is present, use value as replacers
        if (binding.modifiers.set) {
            text = this.helper.set(this.template, ...castArray(binding.value))
        } else if (binding.modifiers.plural) {
            text = this.helper.plural(this.template, binding.value)
        }

        return binding.modifiers.block
            ? this.helper.markdownBlock(text, true)
            : this.helper.markdown(text)
    }
}

export default function (locale = 'en-US') {
    return {
        beforeMount (el, binding, vnode) {
            el.markdown = new MarkdownDirective(new Strings(locale), el, binding)
            el.innerHTML = el.markdown.html(el, binding)
        },
        updated (el, binding, vnode) {
            el.innerHTML = el.markdown.html(el, binding)
        }
    }
}
