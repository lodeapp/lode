import _get from 'lodash/get'

export default class Translation {
    constructor (locale) {
        this.locale = locale
        this.intervalRegExp = /^[\{\[]([^\[\]\{\}]*)[\}\]]\s?(.*)/
    }

    install (Vue, options) {
        Vue.prototype.$trans = this
    }

    /**
     * Whether a given string contains number intervals
     *
     * @param  {String} string
     * @return {Boolean}
     */
    hasIntervals (string) {
        return Boolean(string.match(this.intervalRegExp))
    }

    /**
     * Returns the string with the number interval
     * that matches the given amount
     *
     * @param  {String} string
     * @param  {String|Number} amount
     * @return {String}
     */
    getIntervalString (string, amount) {
        const strings = string.split('|')
        // If string has no pipe sentence division,
        // return it without further manipulation
        if (!strings.length) {
            return string
        }
        const index = this.getIntervalIndex(strings.map(function (partial) {
            return _get(partial.match(this.intervalRegExp), 1, null)
        }.bind(this)), amount)

        // Fallback to first if index is not found
        string = index === false ? strings[0] : strings[index]

        // Return string without interval portion
        return _get(string.match(this.intervalRegExp), 2, string)
    }

    /**
     * Returns the index in the array of intervals
     * which matches the given amount, or false
     * if no match was found
     *
     * @param  {Array} intervals
     * @param  {String|Number} amount
     * @return {Number|false}
     */
    getIntervalIndex (intervals, amount) {
        // Clear whitespace and delimiters before starting
        // so we can be more lenient with how translators
        // or developers define their intervals
        intervals = intervals.map((interval) => {
            return interval.replace(/[\{\}\[\]\s]+/g, '')
        })
        for (let index = 0; index < intervals.length; index++) {
            // If it's a range, also check for wildcards
            if (intervals[index].indexOf(',') > -1) {
                const [from, to] = intervals[index].split(',')
                if (
                    (to === '*' && amount >= from) ||
                    (from === '*' && amount <= to) ||
                    (amount >= from && amount <= to)
                ) {
                    return index
                }
            // eslint-disable-next-line eqeqeq
            } else if (intervals[index] == amount) {
                return index
            }
        }
        return false
    }

    /**
     * Given a string with all plural forms (separated by the
     * pipe character), returns the segment which best
     * represents the amount given
     *
     * @param  {String} string
     * @param  {String|Number} amount
     * @return {String}
     */
    getPlural (string, amount) {
        if (!this.hasIntervals(string)) {
            // If string doesn't have explicit intervals, use sensible
            // default or singular vs. plural. Complex pluralisation
            // rules should be defined in the translated string itself
            string = string.split('|')
            return string[amount === 1 ? 0 : 1]
        }

        return this.getIntervalString(string, amount)
    }
}
