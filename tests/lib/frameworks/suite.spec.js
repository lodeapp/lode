import { Suite } from '@lib/frameworks/suite'
import { ApplicationWindow } from '@main/application-window'

vi.mock('@main/application-window')
vi.mock('@main/file')

function createMockFramework(overrides = {}) {
    const nuggetStatuses = {}
    return {
        getApplicationWindow: () => new ApplicationWindow(),
        getNuggetStatus: vi.fn(id => nuggetStatuses[id] || 'idle'),
        setNuggetStatus: vi.fn((id, to) => { nuggetStatuses[id] = to }),
        canToggleTests: false,
        runsInRemote: false,
        fullPath: '/repo',
        path: '',
        getRemotePath: vi.fn().mockReturnValue(''),
        ...overrides,
    }
}

describe('suite instantiation', () => {
    it('instantiates with a result', () => {
        const suite = new Suite(createMockFramework(), {
            file: '/repo/test.js',
        })
        expect(suite.getId()).toBe('/repo/test.js')
        expect(suite.getFile()).toBe('/repo/test.js')
    })

    it('getDisplayName returns relative path', () => {
        const suite = new Suite(createMockFramework({ fullPath: '/repo' }), {
            file: '/repo/unit/my-test.js',
        })
        expect(suite.getDisplayName()).toBe('unit/my-test.js')
    })
})

describe('suite file paths', () => {
    it('getFilePath returns file for local framework', () => {
        const suite = new Suite(createMockFramework(), {
            file: '/repo/tests/my-test.js',
        })
        expect(suite.getFilePath()).toBe('/repo/tests/my-test.js')
    })

    it('getFilePath returns joined path for remote framework', () => {
        const suite = new Suite(createMockFramework({
            runsInRemote: true,
            fullPath: '/local/repo',
            path: 'tests',
            getRemotePath: vi.fn().mockReturnValue('/remote'),
        }), {
            file: '/remote/tests/my-test.js',
        })
        expect(suite.getFilePath()).toBe('/local/repo/my-test.js')
    })

    it('getRelativePath returns path relative to framework fullPath', () => {
        const suite = new Suite(createMockFramework({ fullPath: '/repo' }), {
            file: '/repo/unit/my-test.js',
        })
        expect(suite.getRelativePath()).toBe('unit/my-test.js')
    })

    it('getRelativePath for remote framework with path', () => {
        const suite = new Suite(createMockFramework({
            runsInRemote: true,
            fullPath: '/local/repo',
            path: 'tests',
            getRemotePath: vi.fn().mockReturnValue('/remote'),
        }), {
            file: '/remote/tests/unit/my-test.js',
        })
        expect(suite.getRelativePath()).toBe('unit/my-test.js')
    })

    it('getRelativePath for remote framework without remote path strips leading slash', () => {
        const suite = new Suite(createMockFramework({
            runsInRemote: true,
            fullPath: '/local/repo',
            path: 'tests',
            getRemotePath: vi.fn().mockReturnValue('/'),
        }), {
            file: '/tests/my-test.js',
        })
        expect(suite.getRelativePath()).toBe('tests/my-test.js')
    })

    it('getFilePathRelativeToBase for local framework', () => {
        const suite = new Suite(createMockFramework({
            fullPath: '/repo/tests',
            path: 'tests',
        }), {
            file: '/repo/tests/unit/my-test.js',
        })
        expect(suite.getFilePathRelativeToBase()).toBe('tests/unit/my-test.js')
    })
})

describe('suite metadata', () => {
    it('getMeta returns empty object when no meta', () => {
        const suite = new Suite(createMockFramework(), {
            file: '/test.js',
        })
        expect(suite.getMeta()).toEqual({})
    })

    it('getMeta returns meta when present', () => {
        const suite = new Suite(createMockFramework(), {
            file: '/test.js',
            meta: { n: 1, custom: 'data' },
        })
        expect(suite.getMeta()).toEqual({ n: 1, custom: 'data' })
    })

    it('getMeta returns specific key', () => {
        const suite = new Suite(createMockFramework(), {
            file: '/test.js',
            meta: { n: 1 },
        })
        expect(suite.getMeta('n')).toBe(1)
    })

    it('getMeta returns fallback for missing key', () => {
        const suite = new Suite(createMockFramework(), {
            file: '/test.js',
            meta: { n: 1 },
        })
        expect(suite.getMeta('missing', 'default')).toBe('default')
    })

    it('getMeta returns fallback when meta is null', () => {
        const suite = new Suite(createMockFramework(), {
            file: '/test.js',
            meta: null,
        })
        expect(suite.getMeta('key', 'fallback')).toBe('fallback')
    })

    it('resetMeta clears meta', () => {
        const suite = new Suite(createMockFramework(), {
            file: '/test.js',
            meta: { n: 1 },
        })
        suite.resetMeta()
        expect(suite.getMeta()).toEqual({})
    })

    it('resetMeta is no-op when meta is already null', () => {
        const suite = new Suite(createMockFramework(), {
            file: '/test.js',
        })
        expect(() => suite.resetMeta()).not.toThrow()
    })
})

describe('suite console', () => {
    it('getConsole returns null when no console', () => {
        const suite = new Suite(createMockFramework(), {
            file: '/test.js',
        })
        expect(suite.getConsole()).toBeNull()
    })

    it('getConsole returns null for empty array', () => {
        const suite = new Suite(createMockFramework(), {
            file: '/test.js',
            console: [],
        })
        expect(suite.getConsole()).toBeNull()
    })

    it('getConsole returns array when console present', () => {
        const suite = new Suite(createMockFramework(), {
            file: '/test.js',
            console: ['log line 1', 'log line 2'],
        })
        expect(suite.getConsole()).toEqual(['log line 1', 'log line 2'])
    })
})

describe('suite tests loaded', () => {
    it('testsLoaded returns true by default', () => {
        const suite = new Suite(createMockFramework(), {
            file: '/test.js',
        })
        expect(suite.testsLoaded()).toBe(true)
    })

    it('testsLoaded returns false when explicitly set', () => {
        const suite = new Suite(createMockFramework(), {
            file: '/test.js',
            testsLoaded: false,
        })
        expect(suite.testsLoaded()).toBe(false)
    })

    it('testsLoaded returns true when explicitly set', () => {
        const suite = new Suite(createMockFramework(), {
            file: '/test.js',
            testsLoaded: true,
        })
        expect(suite.testsLoaded()).toBe(true)
    })
})

describe('suite render and persist', () => {
    it('render includes expected fields', () => {
        const suite = new Suite(createMockFramework({ fullPath: '/repo' }), {
            file: '/repo/test.js',
            meta: { n: 1 },
        })
        const rendered = suite.render()
        expect(rendered.file).toBe('/repo/test.js')
        expect(rendered.meta).toEqual({ n: 1 })
        expect(rendered.selected).toBe(false)
        expect(rendered.partial).toBe(false)
        expect(rendered.relative).toBe('test.js')
    })

    it('persist includes tests and testsLoaded', () => {
        const suite = new Suite(createMockFramework({ fullPath: '/repo' }), {
            file: '/repo/test.js',
            testsLoaded: true,
            tests: [
                { id: 'test-1', name: 'Test 1', status: 'passed' },
            ],
        })
        const persisted = suite.persist()
        expect(persisted.file).toBe('/repo/test.js')
        expect(persisted.testsLoaded).toBe(true)
        expect(persisted.tests).toBeDefined()
        expect(persisted.tests.length).toBe(1)
    })

    it('persist omits hasChildren, selected, partial, relative', () => {
        const suite = new Suite(createMockFramework({ fullPath: '/repo' }), {
            file: '/repo/test.js',
        })
        const persisted = suite.persist()
        expect(persisted.hasChildren).toBeUndefined()
        expect(persisted.selected).toBeUndefined()
        expect(persisted.partial).toBeUndefined()
        expect(persisted.relative).toBeUndefined()
    })
})

describe('suite running order', () => {
    it('getRunningOrder returns null when no meta n', () => {
        const suite = new Suite(createMockFramework(), {
            file: '/test.js',
        })
        expect(suite.getRunningOrder()).toBeNull()
    })

    it('getRunningOrder returns n from meta', () => {
        const suite = new Suite(createMockFramework(), {
            file: '/test.js',
            meta: { n: 3 },
        })
        expect(suite.getRunningOrder()).toBe(3)
    })
})

describe('suite framework interaction', () => {
    it('getFramework returns the framework', () => {
        const framework = createMockFramework()
        const suite = new Suite(framework, {
            file: '/test.js',
        })
        expect(suite.getFramework()).toBe(framework)
    })

    it('canToggleTests delegates to framework', () => {
        const suite = new Suite(createMockFramework({ canToggleTests: true }), {
            file: '/test.js',
        })
        expect(suite.canToggleTests()).toBe(true)
    })

    it('canToggleTests returns false when framework cannot', () => {
        const suite = new Suite(createMockFramework({ canToggleTests: false }), {
            file: '/test.js',
        })
        expect(suite.canToggleTests()).toBe(false)
    })
})

describe('suite children', () => {
    it('countChildren returns 0 for suite without tests', () => {
        const suite = new Suite(createMockFramework(), {
            file: '/test.js',
        })
        expect(suite.countChildren()).toBe(0)
    })

    it('countChildren returns test count', () => {
        const suite = new Suite(createMockFramework(), {
            file: '/test.js',
            tests: [
                { id: 't1', name: 'T1', status: 'passed' },
                { id: 't2', name: 'T2', status: 'passed' },
            ],
        })
        expect(suite.countChildren()).toBe(2)
    })

    it('hasChildren is false for empty suite', () => {
        const suite = new Suite(createMockFramework(), {
            file: '/test.js',
        })
        expect(suite.hasChildren()).toBe(false)
    })
})

describe('suite status', () => {
    it('getStatus returns idle for suite without loaded tests', () => {
        const suite = new Suite(createMockFramework(), {
            file: '/test.js',
            testsLoaded: false,
        })
        expect(suite.getStatus()).toBe('idle')
    })

    it('getNuggetStatus is called during construction to determine status', () => {
        const framework = createMockFramework()
        const suite = new Suite(framework, {
            file: '/test.js',
            testsLoaded: true,
            tests: [
                { id: 't1', name: 'T1', status: 'passed' },
            ],
        })
        expect(suite).toBeDefined()
        expect(framework.getNuggetStatus).toHaveBeenCalled()
    })
})
