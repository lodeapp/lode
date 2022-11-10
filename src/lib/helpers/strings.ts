import sha1 from 'sha1-es'
import { truncate } from 'lodash'
import markdown from 'markdown-it'
import latinize from 'latinize'
import Translation from './translation'

export default class Strings {
    protected locale: string
    protected translator: Translation

    constructor (locale = 'en-US') {
        this.locale = locale
        this.translator = new Translation(this.locale)
    }

    /**
     * Generates a random string of 15 characters
     */
    public random (): string {
        let text = ''
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        for (let i = 0; i < 15; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length))
        }
        return text
    }

    /**
     * Replaces diacritics with closes latin representation (e.g. "ü" becomes "u")
     *
     * @param string The string to convert to ASCII
     */
    public ascii (string: string): string {
        return latinize(string)
    }

    /**
     * Turn a markdown string into inline HTML
     *
     * @param string The string to convert to Markdown
     */
    public markdown (string: string): string {
        return markdown({
            typographer: true
        }).renderInline(string)
    }

    /**
     * Turn a markdown string into block HTML
     *
     * @param string The string to convert to Markdown
     * @param breaks Whether to convert line breaks into br
     */
    public markdownBlock (string: string, breaks = true): string {
        return markdown({
            breaks,
            typographer: true
        }).render(string)
    }

    /**
     * Truncates a string to the given length
     * (including the separator character)
     * Full options: https://lodash.com/docs/4.17.5#truncate
     *
     * @param string The string to truncate
     * @param length Maximum length of the resulting string
     * @param options Additional truncation options
     */
    public truncate (string: string, length = 140, options: any): string {
        return truncate(string, {
            ...{
                length,
                omission: '…'
            },
            ...options
        })
    }

    /**
     * Compose a string using placeholders and replacements
     * (e.g. set('Here, have a :0', 'biscuit'))
     *
     * @param string The string to compose
     * @param replacements The replacements to use when composing the string
     */
    public set (string: string, ...replacements: Array<any>): string {
        const replace = typeof replacements[0] === 'object' ? replacements[0] : replacements
        return string.replace(/:(\d+|[a-z]+)/gi, function (match, index) {
            return typeof replace[index] !== 'undefined' ? replace[index] : match
        })
    }

    /**
     * Given a string with all plural forms (separated by the
     * pipe character), returns the segment which best
     * represents the amount given. Also replaces any
     * instances of :n in the string with the actual amount
     *
     * @param strings The pipe-separated list of strings representing plural forms
     * @param amount The amount for which to render a pluralized string
     */
    public plural (strings: string, amount: number): string {
        return this.set(this.translator.getPlural(strings, amount), { n: amount })
    }

    /**
     * Get a hash representation of a given object
     * Strings are allowed as objects for ease-of-use
     *
     * @param object The object to convert to a string, if applicable
     */
    public from (object: string | object): string {
        if (typeof object === 'string') {
            return object
        }
        return sha1.hash(JSON.stringify(object))
    }
}
