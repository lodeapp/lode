import { parseFrameworkStatus, parseStatus } from '@lib/frameworks/status'

it('can determine empty status', () => {
    expect(parseStatus([])).toBe('empty')
    expect(parseStatus(['empty', 'empty'])).toBe('empty')
    expect(parseFrameworkStatus([])).toBe('empty')
    expect(parseFrameworkStatus(['empty', 'empty'])).toBe('empty')
})

it('can determine status even when empty components are present', () => {
    expect(parseStatus(['empty', 'empty', 'idle'])).toBe('idle')
    expect(parseStatus(['empty', 'empty', 'passed'])).toBe('passed')
    expect(parseFrameworkStatus(['empty', 'empty', 'idle'])).toBe('idle')
    expect(parseFrameworkStatus(['empty', 'empty', 'passed'])).toBe('passed')
})

it('can determine running status', () => {
    expect(parseStatus(['empty', 'queued'])).toBe('queued')
    expect(parseStatus(['empty', 'queued', 'running'])).toBe('running')
    expect(parseFrameworkStatus(['empty', 'queued'])).toBe('queued')
    expect(parseFrameworkStatus(['empty', 'queued', 'running'])).toBe('running')
})

it('can determine error status', () => {
    expect(parseStatus(['empty', 'idle', 'error', 'failed', 'warning', 'incomplete', 'skipped', 'passed'])).toBe('error')
    expect(parseFrameworkStatus(['empty', 'idle', 'error', 'failed', 'warning', 'incomplete', 'skipped', 'passed'])).toBe('error')
})

it('can determine failed status', () => {
    expect(parseStatus(['empty', 'idle', 'failed', 'warning', 'incomplete', 'skipped', 'passed'])).toBe('failed')
    expect(parseFrameworkStatus(['empty', 'idle', 'failed', 'warning', 'incomplete', 'skipped', 'passed'])).toBe('failed')
})

it('can determine warning status', () => {
    expect(parseStatus(['empty', 'idle', 'warning', 'incomplete', 'skipped', 'passed'])).toBe('warning')
    expect(parseFrameworkStatus(['empty', 'idle', 'warning', 'incomplete', 'skipped', 'passed'])).toBe('warning')
})

it('can determine partial status', () => {
    // Presence of idle components will return partial status, if all others are below warning level.
    expect(parseStatus(['empty', 'idle', 'incomplete', 'skipped', 'passed'])).toBe('partial')
    expect(parseFrameworkStatus(['empty', 'idle', 'incomplete', 'skipped', 'passed'])).toBe('partial')
})

it('can determine incomplete status', () => {
    expect(parseStatus(['empty', 'incomplete', 'skipped', 'passed'])).toBe('incomplete')
    expect(parseStatus(['empty', 'skipped', 'passed'])).toBe('incomplete')
    expect(parseFrameworkStatus(['empty', 'incomplete', 'skipped', 'passed'])).toBe('incomplete')
    expect(parseFrameworkStatus(['empty', 'skipped', 'passed'])).toBe('incomplete')
})

it('can determine passed status', () => {
    expect(parseStatus(['empty', 'passed'])).toBe('passed')
    expect(parseStatus(['passed'])).toBe('passed')
    expect(parseFrameworkStatus(['empty', 'passed'])).toBe('passed')
    expect(parseFrameworkStatus(['passed'])).toBe('passed')
})

it('can determine framework loading status', () => {
    expect(parseFrameworkStatus([
        'empty',
        'idle',
        'error',
        'failed',
        'warning',
        'incomplete',
        'skipped',
        'passed',
        'loading',
        'refreshing',
    ])).toBe('loading')
})

it('can determine framework refreshing status', () => {
    expect(parseFrameworkStatus([
        'empty',
        'idle',
        'error',
        'failed',
        'warning',
        'incomplete',
        'skipped',
        'passed',
        'refreshing',
    ])).toBe('refreshing')
})

it('can determine error status from missing components', () => {
    expect(parseFrameworkStatus([
        'empty',
        'idle',
        'error',
        'failed',
        'warning',
        'incomplete',
        'skipped',
        'passed',
        'missing',
    ])).toBe('error')
})

it('returns a single status unchanged', () => {
    expect(parseStatus(['passed'])).toBe('passed')
    expect(parseStatus(['failed'])).toBe('failed')
    expect(parseStatus(['idle'])).toBe('idle')
    expect(parseStatus(['running'])).toBe('running')
    expect(parseStatus(['queued'])).toBe('queued')
    expect(parseStatus(['warning'])).toBe('warning')
    expect(parseStatus(['error'])).toBe('error')
    expect(parseStatus(['incomplete'])).toBe('incomplete')
    expect(parseStatus(['skipped'])).toBe('skipped')
    expect(parseStatus(['partial'])).toBe('partial')
})

it('returns running when only queued tests exist alongside others', () => {
    expect(parseStatus(['passed', 'queued'])).toBe('running')
    expect(parseStatus(['failed', 'queued'])).toBe('running')
})

it('returns running for mixed running and other statuses', () => {
    expect(parseStatus(['passed', 'running'])).toBe('running')
    expect(parseStatus(['idle', 'running'])).toBe('running')
})

it('returns incomplete for skipped mixed with passed', () => {
    expect(parseStatus(['passed', 'skipped'])).toBe('incomplete')
})

it('returns partial for idle mixed with passed', () => {
    expect(parseStatus(['idle', 'passed'])).toBe('partial')
})

it('returns partial for idle mixed with incomplete', () => {
    expect(parseStatus(['idle', 'incomplete'])).toBe('partial')
})

it('handles duplicate statuses correctly', () => {
    expect(parseStatus(['passed', 'passed', 'passed'])).toBe('passed')
    expect(parseStatus(['failed', 'failed'])).toBe('failed')
})

it('returns a single framework status unchanged', () => {
    expect(parseFrameworkStatus(['loading'])).toBe('loading')
    expect(parseFrameworkStatus(['refreshing'])).toBe('refreshing')
    expect(parseFrameworkStatus(['missing'])).toBe('missing')
})

it('returns error for missing-only without other framework statuses', () => {
    expect(parseFrameworkStatus(['idle', 'missing'])).toBe('error')
})
