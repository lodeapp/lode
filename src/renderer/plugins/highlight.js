import highlight from 'highlight.js/lib/highlight'
import diff from 'highlight.js/lib/languages/diff'

export default class Highlight {
    constructor () {
        this.highlighter = highlight
        this.highlighter.registerLanguage('diff', diff)
    }

    install (Vue, options) {
        Vue.prototype.$highlight = this
    }

    block (block) {
        return this.highlighter.highlightBlock(block)
    }
}
