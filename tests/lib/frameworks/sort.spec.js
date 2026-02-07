import { reverseDirection, sortDirection, sortDisplayName } from '@lib/frameworks/sort'

describe('sortDisplayName', () => {
    it('returns display name for framework sort', () => {
        expect(sortDisplayName('framework')).toBe('Running order')
    })

    it('returns display name for name sort', () => {
        expect(sortDisplayName('name')).toBe('Name')
    })

    it('returns fallback for unknown sort option', () => {
        expect(sortDisplayName('unknown')).toBe('Unknown sort')
    })
})

describe('reverseDirection', () => {
    it('reverses asc to desc', () => {
        expect(reverseDirection('asc')).toBe('desc')
    })

    it('reverses desc to asc', () => {
        expect(reverseDirection('desc')).toBe('asc')
    })
})

describe('sortDirection', () => {
    it('returns default direction for framework sort', () => {
        expect(sortDirection('framework', false)).toBe('asc')
    })

    it('returns default direction for name sort', () => {
        expect(sortDirection('name', false)).toBe('asc')
    })

    it('returns reversed direction when reverse is true', () => {
        expect(sortDirection('framework', true)).toBe('desc')
        expect(sortDirection('name', true)).toBe('desc')
    })

    it('falls back to asc for unknown sort option', () => {
        expect(sortDirection('unknown', false)).toBe('asc')
    })
})
