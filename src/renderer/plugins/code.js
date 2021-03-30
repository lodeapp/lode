import highlight from 'highlight.js/lib/core'
import diff from 'highlight.js/lib/languages/diff'
import php from 'highlight.js/lib/languages/php'
import javascript from 'highlight.js/lib/languages/javascript'
import json from 'highlight.js/lib/languages/json'
import xml from 'highlight.js/lib/languages/xml'

export default class Code {
    constructor () {
        this.highlighter = highlight
        this.highlighter.registerLanguage('xml', xml)
        this.highlighter.registerLanguage('json', json)
        this.highlighter.registerLanguage('javascript', javascript)
        this.highlighter.registerLanguage('diff', diff)
        this.highlighter.registerLanguage('php', php)

        this.code = null
    }

    install (app) {
        app.config.globalProperties.$code = this
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

    asString (code) {
        if (!code) {
            return ''
        }

        return typeof code === 'object'
            ? this.normalize(Object.values(code).join('\n'))
            : this.normalize(code)
    }

    highlight (code, language) {
        code = this.asString(code)
        return language ? this.highlighter.highlight(language, code) : this.highlighter.highlightAuto(code)
    }

    lines (code, line = 1, highlight = false) {
        line = parseInt(line)
        if (highlight) {
            highlight = parseInt(highlight)
        }
        // Wrap code in empty starting and ending lines, so that we can have
        // padding and still be able to highlight first and last lines with the
        // same height as all other lines.
        return `<table class="has-lines"><tr><td class="line-number"></td><td class="blob"></td></tr><tr${line === highlight ? ' class="highlight"' : ''}><td class="line-number">${line}</td><td class="blob">` + code.replace(/\n/g, () => {
            line++
            return `</td></tr>\n<tr${line === highlight ? ' class="highlight"' : ''}><td class="line-number">${line}</td><td class="blob">`
        }) + '</td></tr><tr><td class="line-number"></td><td class="blob"></td></tr></table>'
    }
}
