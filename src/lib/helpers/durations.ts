import { identity, get, pickBy } from 'lodash'
import Strings from './strings'

export type Duration = {
    days: number
    hours: number
    minutes: number
    seconds: number
    milliseconds: number
}

export default class Durations {
    protected locale: string
    protected strings: Strings

    constructor (locale: string) {
        this.locale = locale
        this.strings = new Strings(this.locale)
    }

    /**
     * Format a millisecond duration into a human-readable string
     *
     * @param milliseconds The amount of milliseconds to format.
     */
    public format (milliseconds: number): string {
        if (!milliseconds) {
            return this.localize(0, 'milliseconds')
        }

        const object = pickBy(this.toObject(milliseconds), identity)
        const entries = Object.entries(object)

        if (entries.length > 2) {
            delete object.milliseconds
        } else if (object.seconds > 0 && object.milliseconds > 0) {
            object.seconds += (object.milliseconds / 1000)
            delete object.milliseconds
        }

        return Object.entries(object).map(entry => {
            return this.localize(entry[1], entry[0])
        }).join(' ')
    }

    /**
     * Parse a millisecond duration into one with days, hours,
     * minutes, seconds and milliseconds.
     *
     * @param milliseconds The amount of milliseconds to parse.
     */
    protected toObject (milliseconds: number): Duration {
        let seconds = Math.floor(milliseconds / 1000)
        milliseconds = milliseconds % 1000
        let minutes = Math.floor(seconds / 60)
        seconds = seconds % 60
        let hours = Math.floor(minutes / 60)
        minutes = minutes % 60
        const days = Math.floor(hours / 24)
        hours = hours % 24
        return {
            days,
            hours,
            minutes,
            seconds,
            milliseconds
        }
    }

    /**
     * Return a localized string for a given amount and time unit.
     *
     * @param amount The duration to localize.
     * @param unit The time unit with which to localize.
     */
    protected localize (amount: number, unit: string): string {
        return get({
            days: this.strings.plural('1 day|:n days', amount),
            hours: this.strings.plural('1 hour|:n hours', amount),
            minutes: this.strings.plural('1 min|:n min', amount),
            seconds: this.strings.set(':0s', amount),
            milliseconds: this.strings.set(':0ms', amount)
        }, unit, '')
    }
}
