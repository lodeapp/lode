import Durations from '@lib/helpers/durations'

const helper = new Durations()

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

it('formats exactly 1 of each singular unit', () => {
    expect(helper.format(1000)).toBe('1s')
    expect(helper.format(60000)).toBe('1 min')
    expect(helper.format(3600000)).toBe('1 hour')
    expect(helper.format(86400000)).toBe('1 day')
})

it('formats seconds with fractional milliseconds', () => {
    expect(helper.format(1500)).toBe('1.5s')
    expect(helper.format(2100)).toBe('2.1s')
    expect(helper.format(1001)).toBe('1.001s')
})

it('drops milliseconds when there are more than 2 units', () => {
    // 1 min + 1s + 500ms = 3 units, ms should be dropped
    expect(helper.format(61500)).toBe('1 min 1s')
})

it('handles null and undefined as zero', () => {
    expect(helper.format(null)).toBe('0ms')
    expect(helper.format(undefined)).toBe('0ms')
})

it('formats boundary at exactly 1 minute with leftover', () => {
    expect(helper.format(60001)).toBe('1 min 1ms')
})

it('pluralises time units correctly', () => {
    expect(helper.format(7200000)).toBe('2 hours')
    expect(helper.format(3600000)).toBe('1 hour')
    expect(helper.format(172800000)).toBe('2 days')
    expect(helper.format(86400000)).toBe('1 day')
    expect(helper.format(120000)).toBe('2 min')
    expect(helper.format(60000)).toBe('1 min')
})
