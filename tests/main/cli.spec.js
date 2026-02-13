import { isUuid, parseCliArgs } from '@main/cli'

vi.mock('@lib/snapshot/types', () => ({
    SNAPSHOT_EXTENSION: '.lode',
}))

vi.mock('electron', () => ({
    app: { isPackaged: false },
}))

// --- isUuid ---

it('recognizes valid v4 UUIDs', () => {
    expect(isUuid('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d')).toBe(true)
    expect(isUuid('A1B2C3D4-E5F6-4A7B-8C9D-0E1F2A3B4C5D')).toBe(true)
})

it('rejects non-UUID strings', () => {
    expect(isUuid('not-a-uuid')).toBe(false)
    expect(isUuid('My Project')).toBe(false)
    expect(isUuid('')).toBe(false)
    // v1 UUID (wrong version nibble)
    expect(isUuid('a1b2c3d4-e5f6-1a7b-8c9d-0e1f2a3b4c5d')).toBe(false)
})

// --- parseCliArgs: gui (default) ---

it('returns gui command when no args are given', () => {
    const cmd = parseCliArgs(['electron', 'main.js'])
    expect(cmd).toEqual({ command: 'gui' })
})

// --- parseCliArgs: help ---

it('parses help command', () => {
    const cmd = parseCliArgs(['electron', 'main.js', 'help'])
    expect(cmd).toEqual({ command: 'help' })
})

// --- parseCliArgs: list ---

it('parses list command without filter', () => {
    const cmd = parseCliArgs(['electron', 'main.js', 'list'])
    expect(cmd).toEqual({ command: 'list', filter: null })
})

it('parses list with a filter argument', () => {
    const cmd = parseCliArgs(['electron', 'main.js', 'list', 'Test'])
    expect(cmd).toEqual({ command: 'list', filter: 'Test' })
})

// --- parseCliArgs: remove ---

it('parses remove with a project name', () => {
    const cmd = parseCliArgs(['electron', 'main.js', 'remove', 'My Project'])
    expect(cmd).toEqual({ command: 'remove', project: 'My Project' })
})

it('parses remove with a UUID', () => {
    const cmd = parseCliArgs([
        'electron',
        'main.js',
        'remove',
        'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    ])
    expect(cmd).toEqual({
        command: 'remove',
        project: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    })
})

it('throws when remove is missing a project', () => {
    expect(() => parseCliArgs(['electron', 'main.js', 'remove']))
        .toThrow('remove requires a project name or UUID')
})

// --- parseCliArgs: run ---

it('parses run with a positional project', () => {
    const cmd = parseCliArgs(['electron', 'main.js', 'run', 'Test'])
    expect(cmd).toEqual({
        command: 'run',
        project: 'Test',
        repos: [],
        frameworks: [],
        output: null,
        compact: false,
    })
})

it('parses run with all flags', () => {
    const cmd = parseCliArgs([
        'electron',
        'main.js',
        'run',
        'CI Suite',
        '--repository',
        'backend',
        '--framework',
        'Jest',
        '--output',
        './output.lode',
    ])
    expect(cmd).toEqual({
        command: 'run',
        project: 'CI Suite',
        repos: ['backend'],
        frameworks: ['Jest'],
        output: './output.lode',
        compact: false,
    })
})

it('parses run with repeatable --repository', () => {
    const cmd = parseCliArgs([
        'electron',
        'main.js',
        'run',
        'P',
        '--repository',
        'api-tests',
        '--repository',
        'backend',
    ])
    expect(cmd.command).toBe('run')
    expect(cmd).toHaveProperty('repos', ['api-tests', 'backend'])
})

it('parses run with repeatable --framework', () => {
    const cmd = parseCliArgs([
        'electron',
        'main.js',
        'run',
        'P',
        '--framework',
        'Jest',
        '--framework',
        'PHPUnit',
    ])
    expect(cmd.command).toBe('run')
    expect(cmd).toHaveProperty('frameworks', ['Jest', 'PHPUnit'])
})

it('throws when run is missing a project argument', () => {
    expect(() => parseCliArgs(['electron', 'main.js', 'run']))
        .toThrow('run requires a project name or UUID as its first argument')
})

it('throws when run project argument looks like a flag', () => {
    expect(() => parseCliArgs(['electron', 'main.js', 'run', '--output', 'x']))
        .toThrow('run requires a project name or UUID as its first argument')
})

it('throws when --repository is missing a value', () => {
    expect(() => parseCliArgs(['electron', 'main.js', 'run', 'P', '--repository']))
        .toThrow('--repository requires a value')
})

it('throws when --framework is missing a value', () => {
    expect(() => parseCliArgs(['electron', 'main.js', 'run', 'P', '--framework']))
        .toThrow('--framework requires a value')
})

it('parses --output without a value as true', () => {
    const cmd = parseCliArgs(['electron', 'main.js', 'run', 'P', '--output'])
    expect(cmd).toHaveProperty('output', true)
})

it('parses --output before another flag as true', () => {
    const cmd = parseCliArgs(['electron', 'main.js', 'run', 'P', '--output', '--compact'])
    expect(cmd).toHaveProperty('output', true)
    expect(cmd).toHaveProperty('compact', true)
})

it('parses run with --compact flag', () => {
    const cmd = parseCliArgs(['electron', 'main.js', 'run', 'P', '--compact'])
    expect(cmd).toEqual({
        command: 'run',
        project: 'P',
        repos: [],
        frameworks: [],
        output: null,
        compact: true,
    })
})

it('defaults compact to false when not specified', () => {
    const cmd = parseCliArgs(['electron', 'main.js', 'run', 'P'])
    expect(cmd).toHaveProperty('compact', false)
})

it('parses --compact alongside other flags', () => {
    const cmd = parseCliArgs([
        'electron',
        'main.js',
        'run',
        'P',
        '--compact',
        '--repository',
        'backend',
        '--output',
        './out.lode',
    ])
    expect(cmd.command).toBe('run')
    expect(cmd).toHaveProperty('compact', true)
    expect(cmd).toHaveProperty('repos', ['backend'])
    expect(cmd).toHaveProperty('output', './out.lode')
})

it('rejects the removed --output-expanded flag', () => {
    expect(() => parseCliArgs(['electron', 'main.js', 'run', 'P', '--output-expanded']))
        .toThrow('Unknown flag: --output-expanded')
})

// --- parseCliArgs: create ---

it('parses create with --repository only', () => {
    const cmd = parseCliArgs(['electron', 'main.js', 'create', '--repository', '/path/to/repo'])
    expect(cmd).toEqual({
        command: 'create',
        project: null,
        repos: ['/path/to/repo'],
    })
})

it('parses create with a positional project name', () => {
    const cmd = parseCliArgs(['electron', 'main.js', 'create', 'My CI', '--repository', '/repo'])
    expect(cmd).toEqual({
        command: 'create',
        project: 'My CI',
        repos: ['/repo'],
    })
})

it('parses create with multiple --repository flags', () => {
    const cmd = parseCliArgs([
        'electron',
        'main.js',
        'create',
        '--repository',
        '/app',
        '--repository',
        '/api',
    ])
    expect(cmd.command).toBe('create')
    expect(cmd).toHaveProperty('repos', ['/app', '/api'])
})

it('throws when create is missing --repository', () => {
    expect(() => parseCliArgs(['electron', 'main.js', 'create']))
        .toThrow('create requires at least one --repository')
})

// --- parseCliArgs: open ---

it('parses open with a .lode file path', () => {
    const cmd = parseCliArgs(['electron', 'main.js', 'open', '/path/to/results.lode'])
    expect(cmd).toEqual({
        command: 'open',
        file: '/path/to/results.lode',
    })
})

it('parses positional .lode file as open shorthand', () => {
    const cmd = parseCliArgs(['electron', 'main.js', '/path/to/results.lode'])
    expect(cmd).toEqual({
        command: 'open',
        file: '/path/to/results.lode',
    })
})

it('parses positional .json file as open shorthand', () => {
    const cmd = parseCliArgs(['electron', 'main.js', '/path/to/results.json'])
    expect(cmd).toEqual({
        command: 'open',
        file: '/path/to/results.json',
    })
})

it('throws when open is missing a file path', () => {
    expect(() => parseCliArgs(['electron', 'main.js', 'open']))
        .toThrow('open requires a file path')
})

// --- parseCliArgs: Electron/Node internal flags ---

it('ignores Electron/Node internal flags and returns gui', () => {
    expect(parseCliArgs(['electron', 'main.js', '--trace-warnings'])).toEqual({ command: 'gui' })
    expect(parseCliArgs(['electron', 'main.js', '--inspect'])).toEqual({ command: 'gui' })
})

// --- parseCliArgs: unknown command ---

it('throws on unknown command', () => {
    expect(() => parseCliArgs(['electron', 'main.js', 'foo']))
        .toThrow('Unknown command: foo')
})

it('throws on unknown flags within a subcommand', () => {
    expect(() => parseCliArgs(['electron', 'main.js', 'run', 'P', '--unknown']))
        .toThrow('Unknown flag: --unknown')
})
