import Durations from '@lib/helpers/durations'

const helper = new Durations()

describe('src/lib/helpers/durations', () => {
    it('formats durations', () => {
        expect(helper.format(0)).toBe('0ms')
        expect(helper.format(1)).toBe('1ms')
        expect(helper.format(166)).toBe('166ms')
        expect(helper.format(3660)).toBe('3.66s')
        expect(helper.format(300000)).toBe('5 min')
        expect(helper.format(300003)).toBe('5 min 3ms')
        expect(helper.format(303303)).toBe('5 min 3s')
        expect(helper.format(34500000)).toBe('9 hours 35 min')
        expect(helper.format(34500003)).toBe('9 hours 35 min')
        expect(helper.format(34503303)).toBe('9 hours 35 min 3s')
        expect(helper.format(134500000)).toBe('1 day 13 hours 21 min 40s')
        expect(helper.format(134500003)).toBe('1 day 13 hours 21 min 40s')
        expect(helper.format(134503303)).toBe('1 day 13 hours 21 min 43s')
        expect(helper.format(2134503303)).toBe('24 days 16 hours 55 min 3s')
        expect(helper.format(52134503303)).toBe('603 days 9 hours 48 min 23s')
        expect(helper.format(995213400000)).toBe('11518 days 16 hours 10 min')
    })
})
