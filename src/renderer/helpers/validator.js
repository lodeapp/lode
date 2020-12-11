/**
 * A generic validation class.
 */
export default class Validator {
    /**
     * Whether the current instance is valid.
     * @param ValidationErrors errors
     */
    constructor (errors) {
        this.errors = errors || {}
    }

    refresh (errors) {
        this.errors = errors || {}
    }

    /**
     * Whether the current instance is valid.
     */
    isValid () {
        return this.hasErrors()
    }

    /**
     * Reset errors in the current instance.
     */
    reset (fields) {
        Object.keys(this.errors).forEach(key => {
            if (!fields || fields.includes(key)) {
                this.errors[key] = []
            }
        })
    }

    /**
     * Whether the current instance has any errors for the given key.
     *
     * @param key The key to check for errors.
     */
    hasErrors (key) {
        if (typeof key === 'undefined') {
            let hasErrors = true
            Object.keys(this.errors).forEach(key => {
                if (this.errors[key].length > 0) {
                    hasErrors = false
                }
            })
            return hasErrors
        }

        return this.errors[key] && this.errors[key].length > 0
    }

    /**
     * Get errors for the given key.
     *
     * @param key The key to get errors from.
     */
    getErrors (key) {
        if (!this.hasErrors(key)) {
            return ''
        }

        return this.errors[key].join('; ')
    }
}
