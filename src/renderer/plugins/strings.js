import sha1 from 'sha1-es'
import _truncate from 'lodash/truncate'
import markdown from 'markdown-it'
import latinize from 'latinize'
import Translation from '@/plugins/translation'
import { filter } from 'fuzzaldrin'

export default class Strings {
    constructor (locale) {
        this.locale = locale
        this.urlRegExp = /((?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,}))\.?)(?::\d{2,5})?(?:[/?#]\S*)?|(((http|ftp|https):\/{2})?(([0-9a-z_-]+\.)+(aero|asia|biz|cat|com|coop|edu|gov|info|int|jobs|mil|mobi|museum|name|net|org|pro|tel|travel|ac|ad|ae|af|ag|ai|al|am|an|ao|aq|ar|as|at|au|aw|ax|az|ba|bb|bd|be|bf|bg|bh|bi|bj|bm|bn|bo|br|bs|bt|bv|bw|by|bz|ca|cc|cd|cf|cg|ch|ci|ck|cl|cm|cn|co|cr|cu|cv|cx|cy|cz|cz|de|dj|dk|dm|do|dz|ec|ee|eg|er|es|et|eu|fi|fj|fk|fm|fo|fr|ga|gb|gd|ge|gf|gg|gh|gi|gl|gm|gn|gp|gq|gr|gs|gt|gu|gw|gy|hk|hm|hn|hr|ht|hu|id|ie|il|im|in|io|iq|ir|is|it|je|jm|jo|jp|ke|kg|kh|ki|km|kn|kp|kr|kw|ky|kz|la|lb|lc|li|lk|lr|ls|lt|lu|lv|ly|ma|mc|md|me|mg|mh|mk|ml|mn|mn|mo|mp|mr|ms|mt|mu|mv|mw|mx|my|mz|na|nc|ne|nf|ng|ni|nl|no|np|nr|nu|nz|nom|pa|pe|pf|pg|ph|pk|pl|pm|pn|pr|ps|pt|pw|py|qa|re|ra|rs|ru|rw|sa|sb|sc|sd|se|sg|sh|si|sj|sj|sk|sl|sm|sn|so|sr|st|su|sv|sy|sz|tc|td|tf|tg|th|tj|tk|tl|tm|tn|to|tp|tr|tt|tv|tw|tz|ua|ug|uk|us|uy|uz|va|vc|ve|vg|vi|vn|vu|wf|ws|ye|yt|yu|za|zm|zw|arpa)(:[0-9]+)?((\/([~0-9a-zA-Z\#\+\%@\.\/_-]+))?(\?[0-9a-zA-Z\+\%@\/&\[\];=_-]+)?)?))\b)/gi

        this.translator = new Translation(this.locale)
    }

    install (Vue, options) {
        Vue.prototype.$string = this
    }

    /**
     * Generates a random string of 15 characters
     *
     * @return {String}
     */
    random () {
        var text = ''
        var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        for (var i = 0; i < 15; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length))
        }
        return text
    }

    /**
     * Replaces diacritics with closes latin representation (e.g. "ü" becomes "u")
     *
     * @param  {String} string
     * @return {String}
     */
    ascii (string) {
        return latinize(string)
    }

    initials (string) {
        return this.ascii(string).replace(/\W*(\w)\w*/g, '$1').toUpperCase()
    }

    /**
     * Whether a string contains a given substring
     *
     * @param  {String} string
     * @param  {String} substring
     * @return {Boolean}
     */
    contains (string, substring) {
        string = this.ascii(string)
        substring = this.ascii(substring)
        if (!string || !substring) {
            return false
        }
        return string.toUpperCase().indexOf(substring.toUpperCase()) > -1
    }

    /**
     * Whether a substring matches a given string,
     * with optional fuzziness
     *
     * @param  {String} substring
     * @param  {String} string
     * @param  {Boolean} fuzzy
     * @return {Boolean}
     */
    matches (substring, string, fuzzy = false) {
        if (!fuzzy) {
            return this.contains(string, substring)
        }
        string = this.ascii(string)
        substring = this.ascii(substring)
        if (!string || !substring) {
            return false
        }
        return filter([string.toUpperCase()], substring.toUpperCase()).length
    }

    /**
     * Whether a string is equivalent to another string
     * (i.e. is equal when comparing in a case-insensitive
     * manner and disregarding diacritics)
     *
     * @param  {String} string
     * @param  {String} otherString
     * @return {Boolean}
     */
    isEquivalent (string, otherString) {
        string = this.ascii(string)
        otherString = this.ascii(otherString)
        if (!string || !otherString) {
            return false
        }
        return string.toUpperCase() === otherString.toUpperCase()
    }

    hasUrl (string) {
        return Boolean(string.match(this.urlRegExp))
    }

    isUrl (string) {
        return string.replace(this.urlRegExp, '') === ''
    }

    pluckUrl (string) {
        return this.hasUrl(string) ? string.match(this.urlRegExp, '')[0] : null
    }

    padProtocol (string, protocol = 'http') {
        return string.match(/^(https?|ftp):\/\//i) ? string : `${protocol}://${string}`
    }

    asDomain (string) {
        const anchor = document.createElement('a')
        anchor.href = this.padProtocol(this.pluckUrl(string))
        return anchor.hostname.replace(/^www./, '')
    }

    tagUrls (string) {
        return string.replace(this.urlRegExp, (match) => {
            const href = this.padProtocol(match)
            return `<a rel="nofollow noopener" target="_blank" href="${href}">${match}</a>`
        })
    }

    /**
     * Turn a markdown string into HTML
     *
     * @param  {String} string
     * @param  {Boolean} breaks
     * @return {String}
     */
    markdown (string, breaks = true) {
        return markdown({
            breaks: breaks,
            typographer: true
        }).render(string)
    }

    /**
     * Truncates a string to the given length
     * (including the separator character)
     * Full options: https://lodash.com/docs/4.17.5#truncate
     *
     * @param  {String} string
     * @param  {String|Number} length
     * @param  {Object} options
     * @return {String}
     */
    truncate (string, length = 140, options) {
        return _truncate(string, { ...{ length, omission: '…' }, ...options })
    }

    /**
     * Capitalize the first character of a string
     *
     * @param  {String} string
     * @return {String}
     */
    capitalize (string) {
        return string.charAt(0).toUpperCase() + string.slice(1)
    }

    /**
     * Capitalise the first character of each word
     * in a string
     *
     * @param  {String} string
     * @return {String}
     */
    ucwords (string) {
        return string.replace(/^(.)|\s+(.)/g, function ($1) {
            return $1.toUpperCase()
        })
    }

    /**
     * Compose a string using placeholders and replacements
     * (e.g. set('Here, have a :0', 'biscuit'))
     *
     * @param  {String} string
     * @return {String}
     */
    set (string) {
        const replace = typeof arguments[1] === 'object' ? arguments[1] : Array.prototype.slice.call(arguments, 1)
        return string.replace(/:(\d+|\w+)/g, function (match, index) {
            return typeof replace[index] !== 'undefined' ? replace[index] : match
        })
    }

    /**
     * Given a string with all plural forms (separated by the
     * pipe character), returns the segment which best
     * represents the amount given. Also replaces any
     * instances of :n in the string with the actual amount
     *
     * @param  {String} string
     * @param  {String|Number} amount
     * @return {String}
     */
    plural (strings, amount) {
        return this.set(this.translator.getPlural(strings, amount), { n: amount })
    }

    /**
     * Get a hash representation of a given object
     * Strings are allowed as objects for ease-of-use
     *
     * @param  {String|Object} object
     * @return {String}
     */
    from (object) {
        if (typeof object === 'string') {
            return object
        }
        return sha1.hash(JSON.stringify(object))
    }
}
