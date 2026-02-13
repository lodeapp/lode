import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'
import { readSnapshot } from '@lib/snapshot/reader'
import { SNAPSHOT_VERSION } from '@lib/snapshot/types'
import { writeSnapshot } from '@lib/snapshot/writer'

vi.mock('@lib/state')
vi.mock('electron-store')

// --- Roundtrip: write → read ---

it('roundtrips a snapshot through write and read', () => {
    const tmpPath = join(tmpdir(), 'lode-test-roundtrip.lode')
    const mockProject = {
        getId: () => 'project-id',
        name: 'Test Project',
        repositories: [
            {
                getId: () => 'repo-id',
                getDisplayName: () => 'my-repo',
                getPath: () => '/nonexistent/path',
                frameworks: [
                    {
                        getId: () => 'fw-id',
                        getDisplayName: () => 'Jest',
                        type: 'jest',
                        path: '/nonexistent/path',
                        runsInRemote: false,
                        remotePath: null,
                        canToggleTests: true,
                        render: () => ({
                            command: 'npx jest',
                            proprietary: {},
                        }),
                        getSuites: () => [],
                        getLedger: () => ({
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
                        }),
                        getStatusMap: () => ({}),
                    },
                ],
            },
        ],
    }

    writeSnapshot(mockProject, tmpPath, '1.0.0')
    const data = readSnapshot(tmpPath)

    expect(data.version).toBe(SNAPSHOT_VERSION)
    expect(data.metadata.projectName).toBe('Test Project')
    expect(data.metadata.lodeVersion).toBe('1.0.0')
    expect(data.project.id).toBe('project-id')
    expect(data.project.name).toBe('Test Project')
    expect(data.project.repositories).toHaveLength(1)
    expect(data.project.repositories[0].name).toBe('my-repo')
    expect(data.project.repositories[0].frameworks).toHaveLength(1)
    expect(data.project.repositories[0].frameworks[0].name).toBe('Jest')
    expect(data.project.repositories[0].frameworks[0].runsInRemote).toBe(false)
    expect(data.project.repositories[0].frameworks[0].remotePath).toBeNull()
    expect(data.project.repositories[0].frameworks[0].ledger.passed).toBe(5)
    expect(data.project.repositories[0].frameworks[0].ledger.failed).toBe(1)
})

it('roundtrips remote framework settings through write and read', () => {
    const tmpPath = join(tmpdir(), 'lode-test-remote-roundtrip.lode')
    const mockProject = {
        getId: () => 'project-remote',
        name: 'Remote Project',
        repositories: [
            {
                getId: () => 'repo-remote',
                getDisplayName: () => 'backend',
                getPath: () => '/nonexistent/backend',
                frameworks: [
                    {
                        getId: () => 'fw-phpunit',
                        getDisplayName: () => 'PHPUnit',
                        type: 'phpunit',
                        path: 'tests',
                        runsInRemote: true,
                        remotePath: '/var/www/html',
                        canToggleTests: true,
                        render: () => ({
                            command: 'vendor/bin/phpunit',
                            proprietary: { xmlConfigPath: 'phpunit.xml' },
                        }),
                        getSuites: () => [],
                        getLedger: () => ({
                            passed: 10,
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
                        }),
                        getStatusMap: () => ({}),
                    },
                ],
            },
        ],
    }

    writeSnapshot(mockProject, tmpPath, '1.0.0')
    const data = readSnapshot(tmpPath)

    const fw = data.project.repositories[0].frameworks[0]
    expect(fw.runsInRemote).toBe(true)
    expect(fw.remotePath).toBe('/var/www/html')
    expect(fw.path).toBe('tests')
})

it('preserves metadata overrides in the snapshot', () => {
    const tmpPath = join(tmpdir(), 'lode-test-overrides.lode')
    const mockProject = {
        getId: () => 'p-id',
        name: 'P',
        repositories: [],
    }

    writeSnapshot(mockProject, tmpPath, '2.0.0', {
        gitBranch: 'main',
        gitCommit: 'abc1234',
        repositoryTargets: ['backend'],
    })
    const data = readSnapshot(tmpPath)

    expect(data.metadata.gitBranch).toBe('main')
    expect(data.metadata.gitCommit).toBe('abc1234')
    expect(data.metadata.repositoryTargets).toEqual(['backend'])
})

// --- Reader validation ---

it('throws on data that is neither valid gzip nor valid JSON', () => {
    const { writeFileSync } = require('node:fs')
    const tmpPath = join(tmpdir(), 'lode-test-bad-data.lode')
    writeFileSync(tmpPath, 'not gzipped data and not json either')

    expect(() => readSnapshot(tmpPath))
        .toThrow('not a valid Lode or JSON file')
})

it('reads a snapshot from plain uncompressed JSON', () => {
    const { writeFileSync } = require('node:fs')
    const tmpPath = join(tmpdir(), 'lode-test-uncompressed.lode')
    const snapshotData = {
        version: SNAPSHOT_VERSION,
        metadata: {
            createdAt: '2026-01-20T10:00:00.000Z',
            lodeVersion: '1.0.0',
            projectName: 'Uncompressed Project',
            projectId: 'uncomp-id',
        },
        project: {
            id: 'uncomp-id',
            name: 'Uncompressed Project',
            repositories: [],
        },
    }
    writeFileSync(tmpPath, JSON.stringify(snapshotData))

    const data = readSnapshot(tmpPath)

    expect(data.version).toBe(SNAPSHOT_VERSION)
    expect(data.metadata.projectName).toBe('Uncompressed Project')
    expect(data.metadata.lodeVersion).toBe('1.0.0')
    expect(data.project.id).toBe('uncomp-id')
    expect(data.project.repositories).toHaveLength(0)
})

it('throws on invalid JSON inside gzip', () => {
    const { writeFileSync } = require('node:fs')
    const tmpPath = join(tmpdir(), 'lode-test-bad-json.lode')
    writeFileSync(tmpPath, gzipSync('not valid json {{{'))

    expect(() => readSnapshot(tmpPath))
        .toThrow('invalid JSON')
})

it('throws on missing version field', () => {
    const { writeFileSync } = require('node:fs')
    const tmpPath = join(tmpdir(), 'lode-test-no-version.lode')
    writeFileSync(tmpPath, gzipSync(JSON.stringify({ metadata: {}, project: {} })))

    expect(() => readSnapshot(tmpPath))
        .toThrow('missing a version field')
})

it('throws on unsupported future version', () => {
    const { writeFileSync } = require('node:fs')
    const tmpPath = join(tmpdir(), 'lode-test-future-version.lode')
    writeFileSync(tmpPath, gzipSync(JSON.stringify({
        version: SNAPSHOT_VERSION + 1,
        metadata: {},
        project: {},
    })))

    expect(() => readSnapshot(tmpPath))
        .toThrow('newer than this version of Lode supports')
})

it('throws on missing metadata or project fields', () => {
    const { writeFileSync } = require('node:fs')
    const tmpPath = join(tmpdir(), 'lode-test-missing-fields.lode')
    writeFileSync(tmpPath, gzipSync(JSON.stringify({ version: 1 })))

    expect(() => readSnapshot(tmpPath))
        .toThrow('missing required fields')
})

it('throws when the file does not exist', () => {
    expect(() => readSnapshot('/nonexistent/path.lode'))
        .toThrow('Unable to read snapshot file')
})

// --- Comprehensive format validation ---

it('preserves full structure with multiple repos, frameworks, and suites', () => {
    const tmpPath = join(tmpdir(), 'lode-test-comprehensive.lode')

    const suite1 = { file: '/repo/tests/AuthTest.php', relative: 'tests/AuthTest.php', meta: { n: 1 }, hasChildren: true, selected: false, partial: false }
    const suite2 = { file: '/repo/tests/CartTest.php', relative: 'tests/CartTest.php', meta: { n: 2 }, hasChildren: true, selected: false, partial: false }
    const suite3 = { file: '/repo/tests/UserTest.php', relative: 'tests/UserTest.php', meta: { n: 3 }, hasChildren: false, selected: false, partial: false }

    const jestSuite1 = { file: '/app/__tests__/App.spec.js', relative: '__tests__/App.spec.js', meta: {}, hasChildren: true, selected: false, partial: false }
    const jestSuite2 = { file: '/app/__tests__/Utils.spec.js', relative: '__tests__/Utils.spec.js', meta: {}, hasChildren: true, selected: false, partial: false }

    const mockProject = {
        getId: () => 'proj-comprehensive',
        name: 'Full Project',
        repositories: [
            {
                getId: () => 'repo-backend',
                getDisplayName: () => 'backend',
                getPath: () => '/nonexistent/backend',
                frameworks: [
                    {
                        getId: () => 'fw-phpunit',
                        getDisplayName: () => 'PHPUnit',
                        type: 'phpunit',
                        path: '/nonexistent/backend',
                        runsInRemote: false,
                        remotePath: null,
                        canToggleTests: true,
                        render: () => ({
                            command: 'vendor/bin/phpunit',
                            proprietary: { xmlConfigPath: 'phpunit.xml' },
                        }),
                        getSuites: () => [
                            { getId: () => '/repo/tests/AuthTest.php', persist: () => suite1 },
                            { getId: () => '/repo/tests/CartTest.php', persist: () => suite2 },
                            { getId: () => '/repo/tests/UserTest.php', persist: () => suite3 },
                        ],
                        getLedger: () => ({
                            passed: 2,
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
                        }),
                        getStatusMap: () => ({
                            '/repo/tests/AuthTest.php': 'passed',
                            '/repo/tests/CartTest.php': 'failed',
                            '/repo/tests/UserTest.php': 'passed',
                        }),
                    },
                ],
            },
            {
                getId: () => 'repo-frontend',
                getDisplayName: () => 'frontend',
                getPath: () => '/nonexistent/frontend',
                frameworks: [
                    {
                        getId: () => 'fw-jest',
                        getDisplayName: () => 'Jest',
                        type: 'jest',
                        path: '/nonexistent/frontend',
                        runsInRemote: false,
                        remotePath: null,
                        canToggleTests: false,
                        render: () => ({
                            command: 'npx jest',
                            proprietary: {},
                        }),
                        getSuites: () => [
                            { getId: () => '/app/__tests__/App.spec.js', persist: () => jestSuite1 },
                            { getId: () => '/app/__tests__/Utils.spec.js', persist: () => jestSuite2 },
                        ],
                        getLedger: () => ({
                            passed: 1,
                            failed: 0,
                            error: 0,
                            skipped: 1,
                            incomplete: 0,
                            warning: 0,
                            queued: 0,
                            running: 0,
                            partial: 0,
                            empty: 0,
                            idle: 0,
                        }),
                        getStatusMap: () => ({
                            '/app/__tests__/App.spec.js': 'passed',
                            '/app/__tests__/Utils.spec.js': 'skipped',
                        }),
                    },
                ],
            },
        ],
    }

    writeSnapshot(mockProject, tmpPath, '3.0.0', {
        gitBranch: 'feature/checkout',
        gitCommit: 'def5678',
        totalDuration: 12500,
        repositoryTargets: ['backend', 'frontend'],
        frameworkTargets: ['PHPUnit', 'Jest'],
    })

    const data = readSnapshot(tmpPath)

    // Top-level structure
    expect(data.version).toBe(SNAPSHOT_VERSION)
    expect(data.project.id).toBe('proj-comprehensive')
    expect(data.project.name).toBe('Full Project')

    // Metadata
    expect(data.metadata.lodeVersion).toBe('3.0.0')
    expect(data.metadata.projectName).toBe('Full Project')
    expect(data.metadata.projectId).toBe('proj-comprehensive')
    expect(data.metadata.gitBranch).toBe('feature/checkout')
    expect(data.metadata.gitCommit).toBe('def5678')
    expect(data.metadata.totalDuration).toBe(12500)
    expect(data.metadata.repositoryTargets).toEqual(['backend', 'frontend'])
    expect(data.metadata.frameworkTargets).toEqual(['PHPUnit', 'Jest'])
    expect(data.metadata.createdAt).toBeTruthy()

    // Repositories
    expect(data.project.repositories).toHaveLength(2)

    const backend = data.project.repositories[0]
    expect(backend.id).toBe('repo-backend')
    expect(backend.name).toBe('backend')
    expect(backend.path).toBe('/nonexistent/backend')
    expect(backend.frameworks).toHaveLength(1)

    const frontend = data.project.repositories[1]
    expect(frontend.id).toBe('repo-frontend')
    expect(frontend.name).toBe('frontend')
    expect(frontend.path).toBe('/nonexistent/frontend')
    expect(frontend.frameworks).toHaveLength(1)

    // PHPUnit framework
    const phpunit = backend.frameworks[0]
    expect(phpunit.id).toBe('fw-phpunit')
    expect(phpunit.name).toBe('PHPUnit')
    expect(phpunit.type).toBe('phpunit')
    expect(phpunit.command).toBe('vendor/bin/phpunit')
    expect(phpunit.runsInRemote).toBe(false)
    expect(phpunit.remotePath).toBeNull()
    expect(phpunit.canToggleTests).toBe(true)
    expect(phpunit.proprietary).toEqual({ xmlConfigPath: 'phpunit.xml' })
    expect(phpunit.suites).toHaveLength(3)
    expect(phpunit.suites[0]).toEqual(suite1)
    expect(phpunit.suites[1]).toEqual(suite2)
    expect(phpunit.suites[2]).toEqual(suite3)
    expect(phpunit.ledger).toEqual({
        passed: 2,
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
    })
    expect(phpunit.statuses).toEqual({
        '/repo/tests/AuthTest.php': 'passed',
        '/repo/tests/CartTest.php': 'failed',
        '/repo/tests/UserTest.php': 'passed',
    })

    // Jest framework
    const jest = frontend.frameworks[0]
    expect(jest.id).toBe('fw-jest')
    expect(jest.name).toBe('Jest')
    expect(jest.type).toBe('jest')
    expect(jest.command).toBe('npx jest')
    expect(jest.runsInRemote).toBe(false)
    expect(jest.remotePath).toBeNull()
    expect(jest.canToggleTests).toBe(false)
    expect(jest.proprietary).toEqual({})
    expect(jest.suites).toHaveLength(2)
    expect(jest.suites[0]).toEqual(jestSuite1)
    expect(jest.suites[1]).toEqual(jestSuite2)
    expect(jest.ledger).toEqual({
        passed: 1,
        failed: 0,
        error: 0,
        skipped: 1,
        incomplete: 0,
        warning: 0,
        queued: 0,
        running: 0,
        partial: 0,
        empty: 0,
        idle: 0,
    })
    expect(jest.statuses).toEqual({
        '/app/__tests__/App.spec.js': 'passed',
        '/app/__tests__/Utils.spec.js': 'skipped',
    })
})

// --- Nested test roundtrip ---

it('preserves deeply nested test structures through write and read', () => {
    const tmpPath = join(tmpdir(), 'lode-test-nested.lode')

    const nestedSuite = {
        file: '/app/tests/nested.test.js',
        testsLoaded: true,
        tests: [
            {
                id: 'describe-1',
                name: 'top describe',
                status: 'passed',
                tests: [
                    {
                        id: 'describe-2',
                        name: 'inner describe',
                        status: 'passed',
                        tests: [
                            {
                                id: 'test-leaf',
                                name: 'deepest test',
                                status: 'passed',
                            },
                        ],
                    },
                ],
            },
        ],
    }

    const mockProject = {
        getId: () => 'nested-proj',
        name: 'Nested',
        repositories: [
            {
                getId: () => 'repo-1',
                getDisplayName: () => 'app',
                getPath: () => '/nonexistent',
                frameworks: [
                    {
                        getId: () => 'fw-1',
                        getDisplayName: () => 'Jest',
                        type: 'jest',
                        path: '/nonexistent',
                        runsInRemote: false,
                        remotePath: null,
                        canToggleTests: true,
                        render: () => ({ command: 'jest', proprietary: {} }),
                        getSuites: () => [
                            {
                                getId: () => '/app/tests/nested.test.js',
                                persist: () => nestedSuite,
                            },
                        ],
                        getLedger: () => ({
                            passed: 1,
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
                        }),
                        getStatusMap: () => ({
                            '/app/tests/nested.test.js': 'passed',
                        }),
                    },
                ],
            },
        ],
    }

    writeSnapshot(mockProject, tmpPath, '1.0.0')
    const data = readSnapshot(tmpPath)

    const suite = data.project.repositories[0].frameworks[0].suites[0]
    expect(suite.tests).toHaveLength(1)

    const level1 = suite.tests[0]
    expect(level1.name).toBe('top describe')
    expect(level1.tests).toHaveLength(1)

    const level2 = level1.tests[0]
    expect(level2.name).toBe('inner describe')
    expect(level2.tests).toHaveLength(1)

    const level3 = level2.tests[0]
    expect(level3.name).toBe('deepest test')
    expect(level3.status).toBe('passed')
})
