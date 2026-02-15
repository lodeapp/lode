import {
    aggregateLedgers,
    defaultOutputPath,
    findByNameOrId,
    flattenTests,
    formatSuiteCompact,
    formatSuiteNormal,
    formatSummary,
    resolveOutputPath,
    resolveTargets,
} from '@main/headless'

vi.mock('@lib/state')
vi.mock('electron-store')

// --- findByNameOrId ---

function makeNamed(id, name) {
    return { getId: () => id, getDisplayName: () => name }
}

it('finds an item by name', () => {
    const items = [makeNamed('id-1', 'Alpha'), makeNamed('id-2', 'Beta')]
    expect(findByNameOrId(items, 'Beta', 'Item')).toBe(items[1])
})

it('finds an item by UUID', () => {
    const uuid = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'
    const items = [makeNamed(uuid, 'Alpha'), makeNamed('id-2', 'Beta')]
    expect(findByNameOrId(items, uuid, 'Item')).toBe(items[0])
})

it('throws when no item matches by name', () => {
    const items = [makeNamed('id-1', 'Alpha')]
    expect(() => findByNameOrId(items, 'Gamma', 'Repository'))
        .toThrow('Repository not found: "Gamma". Available: Alpha')
})

it('throws with "(none)" when the list is empty', () => {
    expect(() => findByNameOrId([], 'Gamma', 'Framework'))
        .toThrow('Framework not found: "Gamma". Available: (none)')
})

// --- resolveTargets ---

function makeFramework(id, name) {
    return {
        getId: () => id,
        getDisplayName: () => name,
        frameworks: undefined, // not a repo
    }
}

function makeRepo(id, name, frameworks) {
    return {
        getId: () => id,
        getDisplayName: () => name,
        frameworks,
    }
}

function makeProject(repositories) {
    return { repositories }
}

it('returns all repos and frameworks when no targets specified', () => {
    const fw1 = makeFramework('fw-1', 'Jest')
    const fw2 = makeFramework('fw-2', 'PHPUnit')
    const repo1 = makeRepo('r-1', 'frontend', [fw1])
    const repo2 = makeRepo('r-2', 'backend', [fw2])
    const project = makeProject([repo1, repo2])

    const result = resolveTargets(project, { repos: [], frameworks: [] })
    expect(result.repositories).toHaveLength(2)
    expect(result.frameworks).toHaveLength(2)
})

it('filters to targeted repos only', () => {
    const fw1 = makeFramework('fw-1', 'Jest')
    const fw2 = makeFramework('fw-2', 'PHPUnit')
    const repo1 = makeRepo('r-1', 'frontend', [fw1])
    const repo2 = makeRepo('r-2', 'backend', [fw2])
    const project = makeProject([repo1, repo2])

    const result = resolveTargets(project, { repos: ['backend'], frameworks: [] })
    expect(result.repositories).toEqual([repo2])
    expect(result.frameworks).toEqual([fw2])
})

it('filters to targeted frameworks within repos', () => {
    const fw1 = makeFramework('fw-1', 'Jest')
    const fw2 = makeFramework('fw-2', 'PHPUnit')
    const repo = makeRepo('r-1', 'backend', [fw1, fw2])
    const project = makeProject([repo])

    const result = resolveTargets(project, { repos: [], frameworks: ['Jest'] })
    expect(result.repositories).toHaveLength(1)
    expect(result.frameworks).toEqual([fw1])
})

it('throws when a targeted repo is not found', () => {
    const project = makeProject([makeRepo('r-1', 'frontend', [])])
    expect(() => resolveTargets(project, { repos: ['nonexistent'], frameworks: [] }))
        .toThrow('Repository not found: "nonexistent"')
})

it('throws when a targeted framework is not found', () => {
    const repo = makeRepo('r-1', 'frontend', [makeFramework('fw-1', 'Jest')])
    const project = makeProject([repo])
    expect(() => resolveTargets(project, { repos: [], frameworks: ['PHPUnit'] }))
        .toThrow('Framework not found: "PHPUnit"')
})

// --- resolveTargets: framework disambiguation ---

it('resolves a unique framework by plain name across multiple repos', () => {
    const fw1 = makeFramework('fw-1', 'Jest')
    const fw2 = makeFramework('fw-2', 'PHPUnit')
    const repo1 = makeRepo('r-1', 'frontend', [fw1])
    const repo2 = makeRepo('r-2', 'backend', [fw2])
    const project = makeProject([repo1, repo2])

    const result = resolveTargets(project, { repos: [], frameworks: ['PHPUnit'] })
    expect(result.frameworks).toEqual([fw2])
})

it('throws on ambiguous framework name across repos', () => {
    const fw1 = makeFramework('fw-1', 'Jest')
    const fw2 = makeFramework('fw-2', 'Jest')
    const repo1 = makeRepo('r-1', 'frontend', [fw1])
    const repo2 = makeRepo('r-2', 'backend', [fw2])
    const project = makeProject([repo1, repo2])

    expect(() => resolveTargets(project, { repos: [], frameworks: ['Jest'] }))
        .toThrow('Ambiguous framework name: "Jest" exists in multiple repositories. Use a prefix to disambiguate: frontend:Jest, backend:Jest')
})

it('resolves a framework with repo:framework prefix', () => {
    const fw1 = makeFramework('fw-1', 'Jest')
    const fw2 = makeFramework('fw-2', 'Jest')
    const repo1 = makeRepo('r-1', 'frontend', [fw1])
    const repo2 = makeRepo('r-2', 'backend', [fw2])
    const project = makeProject([repo1, repo2])

    const result = resolveTargets(project, { repos: [], frameworks: ['backend:Jest'] })
    expect(result.frameworks).toEqual([fw2])
})

it('resolves a framework by UUID regardless of name clashes', () => {
    const uuid = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'
    const fw1 = makeFramework(uuid, 'Jest')
    const fw2 = makeFramework('fw-2', 'Jest')
    const repo1 = makeRepo('r-1', 'frontend', [fw1])
    const repo2 = makeRepo('r-2', 'backend', [fw2])
    const project = makeProject([repo1, repo2])

    const result = resolveTargets(project, { repos: [], frameworks: [uuid] })
    expect(result.frameworks).toEqual([fw1])
})

it('throws when prefixed repo name is not found', () => {
    const fw = makeFramework('fw-1', 'Jest')
    const repo = makeRepo('r-1', 'frontend', [fw])
    const project = makeProject([repo])

    expect(() => resolveTargets(project, { repos: [], frameworks: ['nonexistent:Jest'] }))
        .toThrow('Repository not found: "nonexistent"')
})

it('throws when prefixed framework name is not found in target repo', () => {
    const fw = makeFramework('fw-1', 'Jest')
    const repo = makeRepo('r-1', 'frontend', [fw])
    const project = makeProject([repo])

    expect(() => resolveTargets(project, { repos: [], frameworks: ['frontend:PHPUnit'] }))
        .toThrow('Framework not found: "PHPUnit"')
})

// --- aggregateLedgers ---

function makeLedgerFramework(ledger) {
    return { getLedger: () => ledger }
}

it('sums ledgers from multiple frameworks', () => {
    const fw1 = makeLedgerFramework({ passed: 10, failed: 2, error: 0, skipped: 1, incomplete: 0, warning: 0, queued: 0, running: 0, partial: 0, empty: 0, idle: 0 })
    const fw2 = makeLedgerFramework({ passed: 5, failed: 0, error: 1, skipped: 0, incomplete: 1, warning: 0, queued: 0, running: 0, partial: 0, empty: 0, idle: 0 })
    const totals = aggregateLedgers([fw1, fw2])
    expect(totals.passed).toBe(15)
    expect(totals.failed).toBe(2)
    expect(totals.error).toBe(1)
    expect(totals.skipped).toBe(1)
    expect(totals.incomplete).toBe(1)
})

it('returns all zeros when given no frameworks', () => {
    const totals = aggregateLedgers([])
    expect(totals.passed).toBe(0)
    expect(totals.failed).toBe(0)
    expect(totals.error).toBe(0)
})

// --- formatSummary ---

it('formats a ledger with multiple non-zero statuses', () => {
    const summary = formatSummary({
        passed: 10,
        failed: 3,
        error: 1,
        skipped: 2,
        incomplete: 0,
        warning: 0,
        queued: 0,
        running: 0,
        partial: 0,
        empty: 0,
        idle: 0,
    })
    expect(summary).toBe('10 passed, 3 failed, 1 errors, 2 skipped')
})

it('formats a ledger with only passed tests', () => {
    const summary = formatSummary({
        passed: 42,
        failed: 0,
        error: 0,
        skipped: 0,
        incomplete: 0,
        warning: 0,
        queued: 0,
        running: 0,
        partial: 0,
        empty: 0,
        idle: 0,
    })
    expect(summary).toBe('42 passed')
})

it('returns empty string when all counts are zero', () => {
    const summary = formatSummary({
        passed: 0,
        failed: 0,
        error: 0,
        skipped: 0,
        incomplete: 0,
        warning: 0,
        queued: 0,
        running: 0,
        partial: 0,
        empty: 0,
        idle: 0,
    })
    expect(summary).toBe('')
})

// --- defaultOutputPath ---

it('generates a path with project name and timestamp', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-09T14:30:22Z'))

    const path = defaultOutputPath('My Project')
    expect(path).toMatch(/my-project-20260209-143022\.lode$/)

    vi.useRealTimers()
})

it('sanitizes special characters in project name', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))

    const result = defaultOutputPath('Héllo / World!')
    expect(result).toMatch(/h-llo---world--20260101-000000\.lode$/)

    vi.useRealTimers()
})

// --- resolveOutputPath ---

it('appends .lode when path has no extension', () => {
    expect(resolveOutputPath('results')).toBe('results.lode')
})

it('keeps .lode when path already ends with .lode', () => {
    expect(resolveOutputPath('results.lode')).toBe('results.lode')
})

it('keeps .json as-is', () => {
    expect(resolveOutputPath('results.json')).toBe('results.json')
})

it('appends .lode to arbitrary extensions', () => {
    expect(resolveOutputPath('path/to/output.txt')).toBe('path/to/output.txt.lode')
})

// --- flattenTests ---

function makeTest(name, status, children) {
    return {
        name,
        displayName: null,
        status,
        tests: children || [],
    }
}

it('returns leaf tests from a flat list', () => {
    const tests = [makeTest('a', 'passed'), makeTest('b', 'failed')]
    const result = flattenTests(tests)
    expect(result).toHaveLength(2)
    expect(result[0].name).toBe('a')
    expect(result[1].name).toBe('b')
})

it('flattens nested test groups into leaf tests', () => {
    const tests = [
        makeTest('group', 'passed', [
            makeTest('child-a', 'passed'),
            makeTest('child-b', 'failed'),
        ]),
    ]
    const result = flattenTests(tests)
    expect(result).toHaveLength(2)
    expect(result[0].name).toBe('child-a')
    expect(result[1].name).toBe('child-b')
})

it('flattens deeply nested groups', () => {
    const tests = [
        makeTest('L1', 'passed', [
            makeTest('L2', 'passed', [
                makeTest('leaf', 'passed'),
            ]),
        ]),
    ]
    const result = flattenTests(tests)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('leaf')
})

it('returns empty array for empty input', () => {
    expect(flattenTests([])).toEqual([])
})

// --- formatSuiteCompact ---

function makeSuiteResult(file, tests) {
    return { file, relative: null, tests }
}

// eslint-disable-next-line unicorn/escape-case
const ESC = '\x1b'
const ANSI_RE = new RegExp(`${ESC}\\[\\d+m`, 'g')

function stripAnsi(str) {
    return str.replace(ANSI_RE, '')
}

it('renders compact symbols for each test status', () => {
    const suite = makeSuiteResult('test.js', [
        makeTest('a', 'passed'),
        makeTest('b', 'failed'),
        makeTest('c', 'error'),
        makeTest('d', 'skipped'),
        makeTest('e', 'warning'),
        makeTest('f', 'incomplete'),
    ])
    const output = formatSuiteCompact(suite)
    expect(stripAnsi(output)).toBe('.FESWI')
})

it('returns empty string for a suite with no tests', () => {
    const suite = makeSuiteResult('empty.js', [])
    expect(formatSuiteCompact(suite)).toBe('')
})

it('flattens nested tests in compact mode', () => {
    const suite = makeSuiteResult('nested.js', [
        makeTest('group', 'passed', [
            makeTest('a', 'passed'),
            makeTest('b', 'failed'),
        ]),
    ])
    const output = formatSuiteCompact(suite)
    expect(stripAnsi(output)).toBe('.F')
})

// --- formatSuiteNormal ---

it('renders suite header and test lines with icons', () => {
    const suite = makeSuiteResult('src/math.test.js', [
        makeTest('adds numbers', 'passed'),
        makeTest('handles negatives', 'failed'),
    ])
    const output = formatSuiteNormal(suite)
    const plain = stripAnsi(output)
    expect(plain).toContain('src/math.test.js')
    expect(plain).toContain('\u2713 adds numbers')
    expect(plain).toContain('\u00D7 handles negatives')
})

it('preserves describe hierarchy with indentation in normal mode', () => {
    const suite = makeSuiteResult('nested.js', [
        makeTest('describe block', 'passed', [
            makeTest('leaf test', 'passed'),
            makeTest('failing test', 'failed'),
        ]),
    ])
    const output = formatSuiteNormal(suite)
    const plain = stripAnsi(output)
    // Group header at indent 1 (2 spaces), leaves at indent 2 (4 spaces)
    expect(plain).toContain('  describe block\n')
    expect(plain).toContain('    \u2713 leaf test\n')
    expect(plain).toContain('    \u00D7 failing test\n')
})

it('handles deeply nested describe groups', () => {
    const suite = makeSuiteResult('deep.js', [
        makeTest('L1', 'passed', [
            makeTest('L2', 'passed', [
                makeTest('leaf', 'passed'),
            ]),
        ]),
    ])
    const output = formatSuiteNormal(suite)
    const plain = stripAnsi(output)
    expect(plain).toContain('  L1\n')
    expect(plain).toContain('    L2\n')
    expect(plain).toContain('      \u2713 leaf\n')
})

it('uses displayName when available', () => {
    const test = makeTest('internal_name', 'passed')
    test.displayName = 'Friendly Name'
    const suite = makeSuiteResult('test.js', [test])
    const output = formatSuiteNormal(suite)
    const plain = stripAnsi(output)
    expect(plain).toContain('Friendly Name')
    expect(plain).not.toContain('internal_name')
})

it('uses relative path as header when available', () => {
    const suite = {
        file: '/absolute/path/to/test.js',
        relative: 'src/test.js',
        tests: [makeTest('a', 'passed')],
    }
    const output = formatSuiteNormal(suite)
    const plain = stripAnsi(output)
    expect(plain).toContain('src/test.js')
    expect(plain).not.toContain('/absolute/path')
})

it('returns empty string for a suite with no tests in normal mode', () => {
    const suite = makeSuiteResult('empty.js', [])
    expect(formatSuiteNormal(suite)).toBe('')
})

it('shows skip icon for skipped tests', () => {
    const suite = makeSuiteResult('test.js', [makeTest('skipped test', 'skipped')])
    const output = formatSuiteNormal(suite)
    const plain = stripAnsi(output)
    expect(plain).toContain('\u2193 skipped test')
})

// --- formatSummary with color ---

it('includes ANSI color codes when color is true', () => {
    const summary = formatSummary({
        passed: 5,
        failed: 1,
        error: 0,
        skipped: 0,
        incomplete: 0,
        warning: 0,
        queued: 0,
        running: 0,
        partial: 0,
        empty: 0,
        idle: 0,
    }, true)
    // Should contain ANSI escape sequences
    expect(summary).toContain(ESC)
    expect(summary).not.toBe(stripAnsi(summary))
})

it('does not include ANSI codes when color is false', () => {
    const summary = formatSummary({
        passed: 5,
        failed: 1,
        error: 0,
        skipped: 0,
        incomplete: 0,
        warning: 0,
        queued: 0,
        running: 0,
        partial: 0,
        empty: 0,
        idle: 0,
    }, false)
    expect(summary).toBe(stripAnsi(summary))
    expect(summary).toBe('5 passed, 1 failed')
})
