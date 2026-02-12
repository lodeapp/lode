import { SnapshotFramework } from '@lib/snapshot/framework'
import { SnapshotProject } from '@lib/snapshot/project'
import { SnapshotRepository } from '@lib/snapshot/repository'
import { SnapshotSuite } from '@lib/snapshot/suite'
import { SnapshotTest } from '@lib/snapshot/test'
import { ApplicationWindow } from '@main/application-window'

vi.mock('@main/application-window')
vi.mock('@lib/state')
vi.mock('electron-store')

// --- Helpers ---

function makeLedger(overrides = {}) {
    return {
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
        ...overrides,
    }
}

function makeFrameworkData(overrides = {}) {
    return {
        id: 'fw-1',
        name: 'Jest',
        type: 'jest',
        command: 'npx jest',
        path: 'tests',
        suites: [],
        ledger: makeLedger({ passed: 3, failed: 1 }),
        statuses: { 'suite-1': 'passed', 'test-a': 'passed', 'test-b': 'failed' },
        proprietary: {},
        canToggleTests: false,
        ...overrides,
    }
}

function makeRepositoryData(overrides = {}) {
    return {
        id: 'repo-1',
        name: 'my-repo',
        path: '/repos/my-repo',
        frameworks: [makeFrameworkData()],
        ...overrides,
    }
}

function makeSnapshotFile(overrides = {}) {
    return {
        version: 1,
        metadata: {
            createdAt: '2026-01-15T10:00:00Z',
            lodeVersion: '1.0.0',
            projectName: 'Test Project',
            projectId: 'proj-1',
        },
        project: {
            id: 'proj-1',
            name: 'Test Project',
            repositories: [makeRepositoryData()],
        },
        ...overrides,
    }
}

function makeWindow() {
    const window = new ApplicationWindow()
    window.canReceiveEvents = vi.fn(() => true)
    window.send = vi.fn()
    return window
}

function makeMockFramework(statuses = {}) {
    const window = makeWindow()
    return {
        getApplicationWindow: () => window,
        getNuggetStatus: vi.fn(id => statuses[id] || 'idle'),
        setNuggetStatus: vi.fn(),
        canToggleTests: false,
        runsInRemote: false,
        fullPath: '/repos/my-repo/tests',
        path: 'tests',
        getRemotePath: vi.fn().mockReturnValue(''),
    }
}

// --- SnapshotProject ---

describe('snapshotProject', () => {
    it('initialises from snapshot data', () => {
        const window = makeWindow()
        const project = new SnapshotProject(window, makeSnapshotFile())

        expect(project.getId()).toBe('proj-1')
        expect(project.name).toBe('Test Project')
        expect(project.repositories).toHaveLength(1)
        expect(project.isReady()).toBe(true)
    })

    it('returns project identifier', () => {
        const project = new SnapshotProject(makeWindow(), makeSnapshotFile())
        expect(project.getIdentifier()).toEqual({ id: 'proj-1', name: 'Test Project' })
    })

    it('computes status from child repositories', () => {
        const project = new SnapshotProject(makeWindow(), makeSnapshotFile())
        // With passed and failed suites, status should not be idle
        expect(project.status).toBeDefined()
    })

    it('returns first framework as active', () => {
        const project = new SnapshotProject(makeWindow(), makeSnapshotFile())
        const active = project.getActive()
        expect(active.framework).not.toBeNull()
        expect(active.repository).not.toBeNull()
        expect(active.framework.getId()).toBe('fw-1')
    })

    it('handles empty repositories for getActive', () => {
        const data = makeSnapshotFile({
            project: { id: 'p', name: 'P', repositories: [] },
        })
        const project = new SnapshotProject(makeWindow(), data)
        const active = project.getActive()
        expect(active.framework).toBeNull()
        expect(active.repository).toBeNull()
    })

    it('finds repository by id', () => {
        const project = new SnapshotProject(makeWindow(), makeSnapshotFile())
        expect(project.getRepositoryById('repo-1')).toBeDefined()
        expect(project.getRepositoryById('nonexistent')).toBeUndefined()
    })

    it('finds framework by id via getContextByFrameworkId', () => {
        const project = new SnapshotProject(makeWindow(), makeSnapshotFile())
        const ctx = project.getContextByFrameworkId('fw-1')
        expect(ctx).toBeDefined()
        expect(ctx.framework.getId()).toBe('fw-1')
        expect(ctx.repository.getId()).toBe('repo-1')
    })

    it('returns undefined for unknown framework id', () => {
        const project = new SnapshotProject(makeWindow(), makeSnapshotFile())
        expect(project.getContextByFrameworkId('nope')).toBeUndefined()
    })

    it('reports empty correctly', () => {
        const project = new SnapshotProject(makeWindow(), makeSnapshotFile())
        expect(project.empty()).toBe(false)

        const empty = new SnapshotProject(makeWindow(), makeSnapshotFile({
            project: { id: 'p', name: 'P', repositories: [] },
        }))
        expect(empty.empty()).toBe(true)
    })

    it('mutation methods are no-ops', () => {
        const project = new SnapshotProject(makeWindow(), makeSnapshotFile())
        expect(project.isRunning()).toBe(false)
        expect(project.isRefreshing()).toBe(false)
        expect(project.isBusy()).toBe(false)

        // These should not throw
        project.start()
        project.refresh()
        project.save()
        project.updateOptions({})
    })

    it('stop returns a promise', async () => {
        const project = new SnapshotProject(makeWindow(), makeSnapshotFile())
        await expect(project.stop()).resolves.toBeUndefined()
    })

    it('addRepository throws in snapshot mode', async () => {
        const project = new SnapshotProject(makeWindow(), makeSnapshotFile())
        await expect(() => project.addRepository({})).rejects.toThrow('Cannot add repositories')
    })

    it('renders correctly', () => {
        const project = new SnapshotProject(makeWindow(), makeSnapshotFile())
        const rendered = project.render()
        expect(rendered.id).toBe('proj-1')
        expect(rendered.name).toBe('Test Project')
        expect(rendered.status).toBeDefined()
    })

    it('returns progress ledger with zero values', () => {
        const project = new SnapshotProject(makeWindow(), makeSnapshotFile())
        expect(project.getProgressLedger()).toEqual({ run: 0, total: 0 })
        expect(project.getProgress()).toBe(1)
    })

    it('emits repositories to renderer', () => {
        const window = makeWindow()
        const project = new SnapshotProject(window, makeSnapshotFile())
        project.emitRepositoriesToRenderer()
        expect(window.send).toHaveBeenCalledWith(
            'proj-1:repositories',
            [expect.any(Array)],
        )
    })

    it('emitAllToRenderer emits full tree', () => {
        const window = makeWindow()
        const project = new SnapshotProject(window, makeSnapshotFile())
        project.emitAllToRenderer()

        const calls = window.send.mock.calls.map(c => c[0])
        expect(calls).toContain('proj-1:repositories')
        expect(calls).toContain('proj-1:status:index')
        expect(calls).toContain('repo-1:frameworks')
        expect(calls).toContain('repo-1:status:sidebar')
        expect(calls).toContain('fw-1:refreshed')
        expect(calls).toContain('fw-1:ledger')
        expect(calls).toContain('fw-1:status:sidebar')
        expect(calls).toContain('fw-1:status:list')
    })
})

// --- SnapshotRepository ---

describe('snapshotRepository', () => {
    it('initialises from data', () => {
        const repo = new SnapshotRepository(makeWindow(), makeRepositoryData())
        expect(repo.getId()).toBe('repo-1')
        expect(repo.getName()).toBe('my-repo')
        expect(repo.getDisplayName()).toBe('my-repo')
        expect(repo.getPath()).toBe('/repos/my-repo')
        expect(repo.frameworks).toHaveLength(1)
    })

    it('finds framework by id', () => {
        const repo = new SnapshotRepository(makeWindow(), makeRepositoryData())
        expect(repo.getFrameworkById('fw-1')).toBeDefined()
        expect(repo.getFrameworkById('nonexistent')).toBeUndefined()
    })

    it('computes status from child frameworks', () => {
        const repo = new SnapshotRepository(makeWindow(), makeRepositoryData())
        expect(repo.status).toBeDefined()
    })

    it('reports empty and count correctly', () => {
        const repo = new SnapshotRepository(makeWindow(), makeRepositoryData())
        expect(repo.empty()).toBe(false)
        expect(repo.count()).toBe(1)

        const emptyRepo = new SnapshotRepository(makeWindow(), makeRepositoryData({ frameworks: [] }))
        expect(emptyRepo.empty()).toBe(true)
        expect(emptyRepo.count()).toBe(0)
    })

    it('supports expand/collapse', () => {
        const repo = new SnapshotRepository(makeWindow(), makeRepositoryData())
        expect(repo.isExpanded()).toBe(true)
        repo.collapse()
        expect(repo.isExpanded()).toBe(false)
        repo.expand()
        expect(repo.isExpanded()).toBe(true)
    })

    it('mutation methods are no-ops', () => {
        const repo = new SnapshotRepository(makeWindow(), makeRepositoryData())
        expect(repo.isRunning()).toBe(false)
        expect(repo.isRefreshing()).toBe(false)
        expect(repo.isBusy()).toBe(false)

        repo.start()
        repo.refresh()
        repo.save()
        repo.setName('ignored')
    })

    it('addFramework throws in snapshot mode', async () => {
        const repo = new SnapshotRepository(makeWindow(), makeRepositoryData())
        await expect(() => repo.addFramework({})).rejects.toThrow('Cannot add frameworks')
    })

    it('renders correctly', () => {
        const repo = new SnapshotRepository(makeWindow(), makeRepositoryData())
        const rendered = repo.render()
        expect(rendered.id).toBe('repo-1')
        expect(rendered.name).toBe('my-repo')
        expect(rendered.path).toBe('/repos/my-repo')
    })

    it('returns zero progress ledger', () => {
        const repo = new SnapshotRepository(makeWindow(), makeRepositoryData())
        expect(repo.getProgressLedger()).toEqual({ run: 0, total: 0 })
    })

    it('emits frameworks to renderer', () => {
        const window = makeWindow()
        const repo = new SnapshotRepository(window, makeRepositoryData())
        repo.emitFrameworksToRenderer()
        expect(window.send).toHaveBeenCalledWith(
            'repo-1:frameworks',
            [expect.any(Array)],
        )
    })
})

// --- SnapshotFramework ---

describe('snapshotFramework', () => {
    function makeFramework(dataOverrides = {}) {
        return new SnapshotFramework(
            makeWindow(),
            '/repos/my-repo',
            makeFrameworkData(dataOverrides),
        )
    }

    it('initialises from data', () => {
        const fw = makeFramework()
        expect(fw.getId()).toBe('fw-1')
        expect(fw.getDisplayName()).toBe('Jest')
        expect(fw.type).toBe('jest')
        expect(fw.path).toBe('tests')
        expect(fw.fullPath).toBe('/repos/my-repo/tests')
        expect(fw.runsInRemote).toBe(false)
        expect(fw.remotePath).toBeNull()
        expect(fw.canToggleTests).toBe(false)
    })

    it('reads runsInRemote and remotePath from snapshot data', () => {
        const fw = makeFramework({
            runsInRemote: true,
            remotePath: '/var/www/html',
        })
        expect(fw.runsInRemote).toBe(true)
        expect(fw.remotePath).toBe('/var/www/html')
        expect(fw.getRemotePath()).toBe('/var/www/html')
    })

    it('defaults runsInRemote and remotePath for legacy snapshots', () => {
        // Simulate a snapshot file created before these fields existed
        const data = makeFrameworkData()
        delete data.runsInRemote
        delete data.remotePath
        const fw = new SnapshotFramework(makeWindow(), '/repos/my-repo', data)
        expect(fw.runsInRemote).toBe(false)
        expect(fw.remotePath).toBeNull()
    })

    it('returns ledger and status map', () => {
        const fw = makeFramework()
        expect(fw.getLedger().passed).toBe(3)
        expect(fw.getLedger().failed).toBe(1)
        expect(fw.getStatusMap()).toHaveProperty('suite-1', 'passed')
    })

    it('returns nugget status from status map', () => {
        const fw = makeFramework()
        expect(fw.getNuggetStatus('test-a')).toBe('passed')
        expect(fw.getNuggetStatus('test-b')).toBe('failed')
        expect(fw.getNuggetStatus('unknown')).toBe('idle')
    })

    it('builds suites from snapshot data', () => {
        const fw = makeFramework({
            suites: [
                { file: '/repos/my-repo/tests/foo.test.js', tests: [], testsLoaded: true },
                { file: '/repos/my-repo/tests/bar.test.js', tests: [], testsLoaded: true },
            ],
        })
        expect(fw.getAllSuites()).toHaveLength(2)
        expect(fw.count()).toBe(2)
        expect(fw.empty()).toBe(false)
    })

    it('finds suite by id', () => {
        const fw = makeFramework({
            suites: [{ file: '/repos/my-repo/tests/foo.test.js', tests: [] }],
        })
        expect(fw.getSuiteById('/repos/my-repo/tests/foo.test.js')).toBeDefined()
        expect(fw.getSuiteById('nonexistent')).toBeUndefined()
    })

    it('mutation methods are no-ops', () => {
        const fw = makeFramework()
        expect(fw.isRunning()).toBe(false)
        expect(fw.isRefreshing()).toBe(false)
        expect(fw.isBusy()).toBe(false)
        expect(fw.isSelective()).toBe(false)

        fw.start()
        fw.refresh()
        fw.save()
        fw.setNuggetStatus('x', 'passed', 'idle', true)
    })

    it('supports active toggling', () => {
        const fw = makeFramework()
        expect(fw.isActive()).toBe(true)
        fw.setActive(false)
        expect(fw.isActive()).toBe(false)
    })

    it('computes status from statuses map when suites lack a status field', () => {
        // Suite.persist(false) omits `status`, so the framework must read
        // from the statuses map keyed by suite file path.
        const fw = makeFramework({
            suites: [
                { file: '/repos/my-repo/tests/a.test.js', tests: [] },
                { file: '/repos/my-repo/tests/b.test.js', tests: [] },
            ],
            statuses: {
                '/repos/my-repo/tests/a.test.js': 'passed',
                '/repos/my-repo/tests/b.test.js': 'failed',
            },
        })
        expect(fw.status).toBe('failed')
    })

    it('falls back to suite status field when statuses map has no entry', () => {
        const fw = makeFramework({
            suites: [
                { file: '/repos/my-repo/tests/a.test.js', status: 'passed', tests: [] },
                { file: '/repos/my-repo/tests/b.test.js', status: 'skipped', tests: [] },
            ],
            statuses: {},
        })
        // parseStatus(['passed', 'skipped']) → 'incomplete' (mixed passed+skipped)
        expect(fw.status).toBe('incomplete')
    })

    it('defaults to idle when neither statuses map nor suite status exist', () => {
        const fw = makeFramework({
            suites: [
                { file: '/repos/my-repo/tests/a.test.js', tests: [] },
            ],
            statuses: {},
        })
        expect(fw.status).toBe('idle')
    })

    it('returns zero progress ledger', () => {
        const fw = makeFramework()
        expect(fw.getProgressLedger()).toEqual({ run: 0, total: 0 })
    })

    it('renders correctly', () => {
        const fw = makeFramework()
        const rendered = fw.render()
        expect(rendered.id).toBe('fw-1')
        expect(rendered.name).toBe('Jest')
        expect(rendered.type).toBe('jest')
        expect(rendered.path).toBe('tests')
    })

    describe('filtering', () => {
        function makeFrameworkWithSuites() {
            return makeFramework({
                suites: [
                    { file: '/repos/my-repo/tests/auth.test.js', status: 'passed', tests: [] },
                    { file: '/repos/my-repo/tests/user.test.js', status: 'failed', tests: [] },
                    { file: '/repos/my-repo/tests/billing.test.js', status: 'passed', tests: [] },
                ],
                statuses: {
                    '/repos/my-repo/tests/auth.test.js': 'passed',
                    '/repos/my-repo/tests/user.test.js': 'failed',
                    '/repos/my-repo/tests/billing.test.js': 'passed',
                },
            })
        }

        it('returns all suites when no filters', () => {
            const fw = makeFrameworkWithSuites()
            expect(fw.hasFilters()).toBe(false)
            expect(fw.getSuites()).toHaveLength(3)
        })

        it('filters by keyword with fuzzy match', () => {
            const fw = makeFrameworkWithSuites()
            fw.setFilter('keyword', 'auth')
            expect(fw.hasFilters()).toBe(true)
            expect(fw.getSuites()).toHaveLength(1)
        })

        it('filters by exact keyword in quotes', () => {
            const fw = makeFrameworkWithSuites()
            fw.setFilter('keyword', '"user"')
            expect(fw.getSuites()).toHaveLength(1)
        })

        it('filters by status', () => {
            const fw = makeFrameworkWithSuites()
            fw.setFilter('status', ['failed'])
            expect(fw.getSuites()).toHaveLength(1)
        })

        it('resets filters', () => {
            const fw = makeFrameworkWithSuites()
            fw.setFilter('keyword', 'auth')
            expect(fw.getSuites()).toHaveLength(1)
            fw.resetFilters()
            expect(fw.hasFilters()).toBe(false)
            expect(fw.getSuites()).toHaveLength(3)
        })

        it('treats empty status array as no filter', () => {
            const fw = makeFrameworkWithSuites()
            fw.setFilter('status', [])
            expect(fw.hasFilters()).toBe(false)
        })
    })

    it('emits suites to renderer', () => {
        const window = makeWindow()
        const fw = new SnapshotFramework(window, '/repos/my-repo', makeFrameworkData({
            suites: [{ file: 'test.js', tests: [] }],
        }))
        fw.emitSuitesToRenderer()
        // emitToRenderer wraps args in an array: send(event, [suites, count])
        expect(window.send).toHaveBeenCalledWith(
            'fw-1:refreshed',
            [expect.any(Array), expect.any(Number)],
        )
    })

    it('emits ledger to renderer', () => {
        const window = makeWindow()
        const fw = new SnapshotFramework(window, '/repos/my-repo', makeFrameworkData())
        fw.emitLedgerToRenderer()
        // emitToRenderer wraps args in an array: send(event, [ledger, statuses])
        expect(window.send).toHaveBeenCalledWith(
            'fw-1:ledger',
            [expect.objectContaining({ passed: 3, failed: 1 }), expect.any(Object)],
        )
    })
})

// --- SnapshotSuite ---

describe('snapshotSuite', () => {
    function makeSuite(result = {}, framework = null) {
        const fw = framework || makeMockFramework({ '/repos/my-repo/tests/foo.test.js': 'passed' })
        return new SnapshotSuite(fw, {
            file: '/repos/my-repo/tests/foo.test.js',
            tests: [],
            testsLoaded: true,
            meta: { duration: 123 },
            console: [{ type: 'log', message: 'hello' }],
            ...result,
        })
    }

    it('initialises from result data', () => {
        const suite = makeSuite()
        expect(suite.getId()).toBe('/repos/my-repo/tests/foo.test.js')
        expect(suite.getFile()).toBe('/repos/my-repo/tests/foo.test.js')
        expect(suite.testsLoaded()).toBe(true)
    })

    it('returns status from framework status map', () => {
        const suite = makeSuite()
        expect(suite.getStatus()).toBe('passed')
    })

    it('returns idle when status not in map', () => {
        const fw = makeMockFramework({})
        const suite = makeSuite({}, fw)
        expect(suite.getStatus()).toBe('idle')
    })

    it('returns meta and console data', () => {
        const suite = makeSuite()
        expect(suite.getMeta()).toEqual({ duration: 123 })
        expect(suite.getConsole()).toEqual([{ type: 'log', message: 'hello' }])
    })

    it('returns null for missing meta and console', () => {
        const suite = makeSuite({ meta: null, console: null })
        expect(suite.getMeta()).toBeNull()
        expect(suite.getConsole()).toBeNull()
    })

    it('returns the parent framework', () => {
        const fw = makeMockFramework()
        const suite = makeSuite({}, fw)
        expect(suite.getFramework()).toBe(fw)
    })

    it('cannot be opened or toggled', () => {
        const suite = makeSuite()
        expect(suite.canBeOpened()).toBe(false)
        expect(suite.canToggleTests()).toBe(false)
    })

    it('debrief is a no-op', async () => {
        const suite = makeSuite()
        await expect(suite.debrief({}, false)).resolves.toBeUndefined()
    })

    it('rebuildTests is a no-op', async () => {
        const suite = makeSuite()
        await expect(suite.rebuildTests({})).resolves.toBeUndefined()
    })

    it('computes relative path for a local framework', () => {
        const suite = makeSuite()
        // fullPath is /repos/my-repo/tests, file is /repos/my-repo/tests/foo.test.js
        expect(suite.getRelativePath()).toBe('foo.test.js')
    })

    it('computes relative path for a remote framework', () => {
        const fw = {
            ...makeMockFramework({ '/var/www/html/tests/Feature/FooTest.php': 'passed' }),
            runsInRemote: true,
            remotePath: '/var/www/html',
            fullPath: '/repos/my-repo/tests',
            path: 'tests',
            getRemotePath: vi.fn().mockReturnValue('/var/www/html'),
        }
        const suite = new SnapshotSuite(fw, {
            file: '/var/www/html/tests/Feature/FooTest.php',
            tests: [],
        })
        expect(suite.getRelativePath()).toBe('Feature/FooTest.php')
    })

    it('uses relative path as display name', () => {
        const suite = makeSuite()
        expect(suite.getDisplayName()).toBe(suite.getRelativePath())
    })

    it('renders suite result', () => {
        const suite = makeSuite()
        const rendered = suite.render()
        expect(rendered.file).toBe('/repos/my-repo/tests/foo.test.js')
        expect(rendered).toHaveProperty('selected')
        expect(rendered).toHaveProperty('partial')
        expect(rendered.relative).toBe('foo.test.js')
    })

    it('persists suite result without transient fields', () => {
        const suite = makeSuite({ tests: [{ id: 'test-1', name: 'test one' }], testsLoaded: true })
        const persisted = suite.persist()
        expect(persisted).toHaveProperty('file')
        expect(persisted).toHaveProperty('tests')
        expect(persisted).not.toHaveProperty('hasChildren')
        expect(persisted).not.toHaveProperty('selected')
        expect(persisted).not.toHaveProperty('relative')
    })

    it('collects nugget IDs recursively', () => {
        const suite = makeSuite({
            tests: [
                {
                    id: 'test-1',
                    name: 'test one',
                    tests: [{ id: 'test-1a', name: 'nested' }],
                },
                { id: 'test-2', name: 'test two' },
            ],
        })
        const ids = suite.getNuggetIds(false)
        expect(ids).toContain('/repos/my-repo/tests/foo.test.js')
        expect(ids).toContain('test-1')
        expect(ids).toContain('test-1a')
        expect(ids).toContain('test-2')
    })

    it('is never fresh', () => {
        const suite = makeSuite()
        expect(suite.isFresh()).toBe(false)
        suite.setFresh(true)
        expect(suite.isFresh()).toBe(false)
    })

    it('has no running order', () => {
        const suite = makeSuite()
        expect(suite.getRunningOrder()).toBeNull()
    })

    it('returns empty context menu (inherited from Nugget)', () => {
        const suite = makeSuite()
        expect(suite.contextMenu()).toEqual([])
    })
})

// --- SnapshotTest ---

describe('snapshotTest', () => {
    function makeTest(result = {}, framework = null) {
        const fw = framework || makeMockFramework({ 'test-1': 'passed' })
        return new SnapshotTest(fw, {
            id: 'test-1',
            name: 'should work',
            displayName: 'it should work',
            status: 'passed',
            feedback: 'Expected true to be true',
            console: [{ type: 'log', message: 'debug' }],
            params: { timeout: 5000 },
            ...result,
        })
    }

    it('initialises from result data', () => {
        const test = makeTest()
        expect(test.getId()).toBe('test-1')
        expect(test.getName()).toBe('should work')
        expect(test.getDisplayName()).toBe('it should work')
    })

    it('falls back to name when displayName is absent', () => {
        const test = makeTest({ displayName: undefined })
        expect(test.getDisplayName()).toBe('should work')
    })

    it('returns status from framework status map', () => {
        const test = makeTest()
        expect(test.getStatus()).toBe('passed')
    })

    it('returns idle when not in status map (getNuggetStatus default)', () => {
        const fw = makeMockFramework({})
        const test = makeTest({ status: 'failed' }, fw)
        // getNuggetStatus returns 'idle' for unknown IDs, which is truthy,
        // so result.status fallback is never reached.
        expect(test.getStatus()).toBe('idle')
    })

    it('renders and persists the result', () => {
        const test = makeTest()
        expect(test.render()).toEqual(test.getResult())
        expect(test.persist()).toEqual(test.getResult())
    })

    it('debrief is a no-op', async () => {
        const test = makeTest()
        await expect(test.debrief({}, false)).resolves.toBeUndefined()
    })

    it('resetResult is a no-op', () => {
        const test = makeTest()
        test.resetResult()
        // Result should be unchanged
        expect(test.getResult().id).toBe('test-1')
    })

    it('is never fresh', () => {
        const test = makeTest()
        expect(test.isFresh()).toBe(false)
        test.setFresh(true)
        expect(test.isFresh()).toBe(false)
    })

    it('returns empty context menu (inherited from Nugget)', () => {
        const test = makeTest()
        expect(test.contextMenu()).toEqual([])
    })
})

// --- SnapshotNugget shared behaviors ---

describe('snapshotNugget (shared suite/test behaviors)', () => {
    it('toggleSelected is a no-op for suites', async () => {
        const fw = makeMockFramework()
        const suite = new SnapshotSuite(fw, { file: 'test.js', tests: [] })
        await suite.toggleSelected(true)
        expect(suite.selected).toBe(false)
    })

    it('toggleSelected is a no-op for tests', async () => {
        const fw = makeMockFramework()
        const test = new SnapshotTest(fw, { id: 't', name: 't' })
        await test.toggleSelected(true)
        expect(test.selected).toBe(false)
    })

    it('toggleExpanded works for suites', async () => {
        const fw = makeMockFramework()
        const suite = new SnapshotSuite(fw, { file: 'test.js', tests: [] })
        expect(suite.expanded).toBe(false)
        await suite.toggleExpanded(true)
        expect(suite.expanded).toBe(true)
        await suite.toggleExpanded()
        expect(suite.expanded).toBe(false)
    })

    it('toggleExpanded works for tests', async () => {
        const fw = makeMockFramework()
        const test = new SnapshotTest(fw, { id: 't', name: 't' })
        expect(test.expanded).toBe(false)
        await test.toggleExpanded(true)
        expect(test.expanded).toBe(true)
    })

    it('toggleExpanded cascades to children', async () => {
        const statuses = { parent: 'passed', 'child-1': 'passed', 'child-2': 'passed' }
        const fw = makeMockFramework(statuses)
        const suite = new SnapshotSuite(fw, {
            file: 'parent',
            tests: [
                { id: 'child-1', name: 'child 1', tests: [] },
                { id: 'child-2', name: 'child 2', tests: [] },
            ],
            testsLoaded: true,
        })
        await suite.toggleExpanded(true)
        // Children should be bloomed (test objects created)
        expect(suite.tests).toHaveLength(2)
    })

    it('newTest creates SnapshotTest instances', async () => {
        const fw = makeMockFramework({ parent: 'passed', child: 'passed' })
        const suite = new SnapshotSuite(fw, {
            file: 'parent',
            tests: [{ id: 'child', name: 'child test' }],
            testsLoaded: true,
        })
        await suite.toggleExpanded(true)
        expect(suite.tests[0]).toBeInstanceOf(SnapshotTest)
        expect(suite.tests[0].getId()).toBe('child')
    })
})
