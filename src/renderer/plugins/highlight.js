import highlight from 'highlight.js/lib/highlight'
import diff from 'highlight.js/lib/languages/diff'
import php from 'highlight.js/lib/languages/php'

export default class Highlight {
    constructor () {
        this.highlighter = highlight
        this.highlighter.registerLanguage('diff', diff)
        this.highlighter.registerLanguage('php', php)

        this.code = null
    }

    install (Vue, options) {
        Vue.prototype.$highlight = this
    }

    removeIndent (code) {
        const indents = code.match(/^[^\S\n\r]*(?=\S)/gm)

        if (!indents || !indents[0].length) {
            return code
        }

        indents.sort(function (a, b) {
            return a.length - b.length
        })

        if (!indents[0].length) {
            return code
        }

        return code.replace(RegExp('^' + indents[0], 'gm'), '')
    }

    normalize (code) {
        return this.removeIndent(code.replace(/\s*?$/gm, ''))
    }

    element (code) {
        this.code = code
        this.highlighter.highlightBlock(this.code)
        return this
    }

    lines (line = 1, highlight = false) {
        this.code.innerHTML = `<table class="has-lines"><tr><td class="line-number">${line}</td><td class="blob">` + this.code.innerHTML.replace(/\n/g, () => {
            line++
            return `</td></tr>\n<tr${line === highlight ? ' class="highlight"' : ''}><td class="line-number">${line}</td><td class="blob">`
        }) + '</td></tr></table>'
        return this
    }
}
