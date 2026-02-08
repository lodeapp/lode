import Translation from '@lib/helpers/translation'

const t = new Translation()

describe('simple plurals (no intervals)', () => {
    it('returns singular form when amount is 1', () => {
        expect(t.getPlural('item|items', 1)).toBe('item')
    })

    it('returns plural form when amount is not 1', () => {
        expect(t.getPlural('item|items', 0)).toBe('items')
        expect(t.getPlural('item|items', 2)).toBe('items')
        expect(t.getPlural('item|items', 100)).toBe('items')
    })

    it('falls back to the full string when no pipe is present', () => {
        expect(t.getPlural('item', 1)).toBe('item')
        expect(t.getPlural('item', 2)).toBe('item')
    })

    it('accepts amount as a string', () => {
        expect(t.getPlural('item|items', '1')).toBe('item')
        expect(t.getPlural('item|items', '2')).toBe('items')
    })
})

describe('interval plurals with exact matches', () => {
    it('matches exact intervals with curly braces', () => {
        expect(t.getPlural('{0} none|{1} one|{2} two', 0)).toBe('none')
        expect(t.getPlural('{0} none|{1} one|{2} two', 1)).toBe('one')
        expect(t.getPlural('{0} none|{1} one|{2} two', 2)).toBe('two')
    })

    it('matches exact intervals with square brackets', () => {
        expect(t.getPlural('[0] none|[1] one|[2] two', 0)).toBe('none')
        expect(t.getPlural('[0] none|[1] one|[2] two', 1)).toBe('one')
    })

    it('falls back to first entry when no interval matches', () => {
        expect(t.getPlural('{1} one|{2} two', 99)).toBe('one')
    })
})

describe('interval plurals with ranges', () => {
    it('matches numeric ranges', () => {
        expect(t.getPlural('[1,3] few|[4,10] many', 1)).toBe('few')
        expect(t.getPlural('[1,3] few|[4,10] many', 3)).toBe('few')
        expect(t.getPlural('[1,3] few|[4,10] many', 4)).toBe('many')
        expect(t.getPlural('[1,3] few|[4,10] many', 10)).toBe('many')
    })

    it('matches wildcard upper bound', () => {
        expect(t.getPlural('{0} none|[1,*] some', 0)).toBe('none')
        expect(t.getPlural('{0} none|[1,*] some', 1)).toBe('some')
        expect(t.getPlural('{0} none|[1,*] some', 999)).toBe('some')
    })

    it('matches wildcard lower bound', () => {
        expect(t.getPlural('[*,5] small|[6,*] big', 0)).toBe('small')
        expect(t.getPlural('[*,5] small|[6,*] big', 5)).toBe('small')
        expect(t.getPlural('[*,5] small|[6,*] big', 6)).toBe('big')
    })

    it('handles three segments with exact and range', () => {
        expect(t.getPlural('{0} none|{1} one|[2,*] many', 0)).toBe('none')
        expect(t.getPlural('{0} none|{1} one|[2,*] many', 1)).toBe('one')
        expect(t.getPlural('{0} none|{1} one|[2,*] many', 2)).toBe('many')
        expect(t.getPlural('{0} none|{1} one|[2,*] many', 50)).toBe('many')
    })
})

describe('interval edge cases', () => {
    it('is lenient with whitespace inside intervals', () => {
        expect(t.getPlural('[ 1, 3 ] few|[ 4 ,* ] many', 2)).toBe('few')
        expect(t.getPlural('[1 , 3] few|[4 ,* ] many', 5)).toBe('many')
    })

    it('allows mixed bracket styles', () => {
        expect(t.getPlural('[1] one|{2,*} many', 1)).toBe('one')
        expect(t.getPlural('[1] one|{2,*} many', 2)).toBe('many')
    })

    it('works when interval has no space before text', () => {
        expect(t.getPlural('{1}one|[2,*]many', 1)).toBe('one')
        expect(t.getPlural('{1}one|[2,*]many', 3)).toBe('many')
    })

    it('handles out-of-order intervals', () => {
        expect(t.getPlural('[2,*] many|{1} one', 1)).toBe('one')
        expect(t.getPlural('[2,*] many|{1} one', 5)).toBe('many')
    })

    it('falls back when amount does not match any interval', () => {
        expect(t.getPlural('{1} one|[5,*] many', 3)).toBe('one')
    })

    it('matches the first applicable range when ranges overlap', () => {
        // Both ranges cover 5, but first match wins
        expect(t.getPlural('[1,5] low|[5,10] high', 5)).toBe('low')
    })
})

describe('amount as string', () => {
    it('converts string amounts to numbers for interval matching', () => {
        expect(t.getPlural('{0} zero|{1} one|[2,*] many', '0')).toBe('zero')
        expect(t.getPlural('{0} zero|{1} one|[2,*] many', '1')).toBe('one')
        expect(t.getPlural('{0} zero|{1} one|[2,*] many', '5')).toBe('many')
    })
})
