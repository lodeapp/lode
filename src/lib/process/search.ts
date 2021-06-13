export class BufferedSearch {
    terms: {
        [index: string]: {
            buffer: string,
            matched: boolean
        }
    } = {}

    term (term: string, string: string): boolean {
        // Have we started looking for this yet? If not, prepare buffer.
        if (!this.terms[term]) {
            this.terms[term] = {
                buffer: '',
                matched: false
            }
        } else if (this.terms[term].matched) {
            return true
        }

        // Strip string of whitespace and append to buffer
        this.terms[term].buffer += string.replace(/\s+/g, '')

        let search = ''
        const characters = term.split('')
        for (let i = 0; i < characters.length; i++) {
            // Create search term substring
            search += characters[i]

            // If length of term substring exceeds that of the buffer, return.
            // Buffer will be kept and next call might yield a result.
            if (search.length > this.terms[term].buffer.length) {
                return false
            }

            // Search for term substring inside buffer
            const index = this.terms[term].buffer.indexOf(search)

            if (index === -1) {
                // If it doesn't match, return false and discard buffer
                this.terms[term].buffer = ''
                this.terms[term].matched = false
                return false
            } else if (index > 0) {
                // If it matches beyond start, discard content preceding match
                this.terms[term].buffer = this.terms[term].buffer.substring(index)
            }
        }

        // If full length of term was iterated through and matches occurred
        // consistently in the buffer, return true.
        return true
    }
}
