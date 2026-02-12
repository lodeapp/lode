import { formatTable } from '@main/init'

// --- formatTable ---

describe('formatTable', () => {
    it('aligns columns correctly', () => {
        const result = formatTable(
            ['Name', 'Type', 'ID'],
            [
                ['Jest', 'jest', 'abc-123'],
                ['PHPUnit', 'phpunit', 'def-456'],
            ],
        )
        const lines = result.split('\n')
        expect(lines).toHaveLength(4) // header + separator + 2 rows
        expect(lines[0]).toMatch(/^Name\s+Type\s+ID/)
        expect(lines[1]).toMatch(/^-+\s+-+\s+-+/)
        expect(lines[2]).toMatch(/^Jest\s+jest\s+abc-123/)
        expect(lines[3]).toMatch(/^PHPUnit\s+phpunit\s+def-456/)
    })

    it('returns empty string when rows are empty', () => {
        expect(formatTable(['A', 'B'], [])).toBe('')
    })

    it('handles a single row', () => {
        const result = formatTable(['Name'], [['Alpha']])
        const lines = result.split('\n')
        expect(lines).toHaveLength(3)
        expect(lines[2]).toBe('Alpha')
    })

    it('pads columns based on widest cell', () => {
        const result = formatTable(
            ['X', 'Y'],
            [
                ['short', 'a'],
                ['a', 'much longer value'],
            ],
        )
        const lines = result.split('\n')
        // Header column widths should match the widest cell in each column
        // Column 0: max("X", "short", "a") = 5
        // Column 1: max("Y", "a", "much longer value") = 17
        expect(lines[0]).toBe('X        Y                ')
        expect(lines[2]).toBe('short    a                ')
        expect(lines[3]).toBe('a        much longer value')
    })
})
