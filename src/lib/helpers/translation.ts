import _get from 'lodash/get'

export default class Translation {
    protected locale: string
    protected intervalRegExp: RegExp

    constructor (locale: string) {
        this.locale = locale
        this.intervalRegExp = /^[\{\[]([^\[\]\{\}]*)[\}\]]\s?(.*)/
    }

    /**
     * Whether a given string contains number intervals
     *
     * @param string The string in which to check intervals
     */
    hasIntervals (string: string): boolean {
        return Boolean(string.match(this.intervalRegExp))
    }

    /**
     * Returns the string with the number interval
     * that matches the given amount
     *
     * @param string The string from which to extract interval text
     * @param amount The amount to match in the string
     */
    getIntervalString (string: string, amount: number): string {
        const strings: Array<string> = string.split('|')
        // If string has no pipe sentence division,
        // return it without further manipulation
        if (!strings.length) {
            return string
        }
        const index = this.getIntervalIndex(strings.map((partial: string) => {
            return _get(partial.match(this.intervalRegExp), 1, '')
        }), amount)

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
     * @param intervals The available interval strings to match
     * @param amount The amount to match for intervals
     */
    getIntervalIndex (intervals: Array<string>, amount: number): number | false {
        // Clear whitespace and delimiters before starting
        // so we can be more lenient with how translators
        // or developers define their intervals
        const parsed: Array<string | number> = intervals.map((interval: string) => {
            const range = interval.replace(/[\{\}\[\]\s]+/g, '')
            return range === '*' || range.indexOf(',') > -1 ? range : parseInt(range)
        })
        for (let index = 0; index < parsed.length; index++) {
            // If it's a range, also check for wildcards
            if (typeof parsed[index] === 'string' && (parsed[index] as string).indexOf(',') > -1) {
                const [from, to] = (parsed[index] as string).split(',')
                if (
                    (to === '*' && amount >= parseInt(from)) ||
                    (from === '*' && amount <= parseInt(to)) ||
                    (amount >= parseInt(from) && amount <= parseInt(to))
                ) {
                    return index
                }
            // eslint-disable-next-line eqeqeq
            } else if (parsed[index] == amount) {
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
     * @param strings The pipe-separated list of strings representing plural forms
     * @param amount The amount for which to render a pluralized string
     */
    getPlural (string: string, amount: number): string {
        if (!this.hasIntervals(string)) {
            // If string doesn't have explicit intervals, use sensible
            // default or singular vs. plural. Complex pluralisation
            // rules should be defined in the translated string itself
            const strings: Array<string> = string.split('|')
            return strings[amount === 1 ? 0 : 1]
        }

        return this.getIntervalString(string, amount)
    }
}
