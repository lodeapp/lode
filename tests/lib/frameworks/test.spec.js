import { Test } from '@lib/frameworks/test'
import { ApplicationWindow } from '@main/application-window'

vi.mock('@main/application-window')

function createMockFramework() {
    const nuggetStatuses = {}
    return {
        getApplicationWindow: () => new ApplicationWindow(),
        getNuggetStatus: vi.fn(id => nuggetStatuses[id] || 'idle'),
        setNuggetStatus: vi.fn((id, to) => { nuggetStatuses[id] = to }),
        canToggleTests: false,
    }
}

describe('test instantiation', () => {
    it('instantiates with a result', () => {
        const test = new Test(createMockFramework(), {
            id: 'test-1',
            name: 'My Test',
            status: 'passed',
        })
        expect(test.getId()).toBe('test-1')
        expect(test.getName()).toBe('My Test')
    })

    it('getDisplayName returns displayName when set', () => {
        const test = new Test(createMockFramework(), {
            id: 'test-1',
            name: 'test_name',
            displayName: 'Test Name',
            status: 'passed',
        })
        expect(test.getDisplayName()).toBe('Test Name')
    })

    it('getDisplayName falls back to name when no displayName', () => {
        const test = new Test(createMockFramework(), {
            id: 'test-1',
            name: 'test_name',
            status: 'passed',
        })
        expect(test.getDisplayName()).toBe('test_name')
    })

    it('getStatus delegates to framework', () => {
        const framework = createMockFramework()
        const test = new Test(framework, {
            id: 'test-1',
            name: 'My Test',
            status: 'passed',
        })
        expect(test.getStatus()).toBeDefined()
        expect(framework.getNuggetStatus).toHaveBeenCalledWith('test-1')
    })

    it('getResult returns the result object', () => {
        const test = new Test(createMockFramework(), {
            id: 'test-1',
            name: 'My Test',
            status: 'passed',
        })
        const result = test.getResult()
        expect(result.id).toBe('test-1')
        expect(result.name).toBe('My Test')
        expect(result.status).toBe('passed')
    })
})

describe('test children', () => {
    it('countChildren returns 0 for leaf test', () => {
        const test = new Test(createMockFramework(), {
            id: 'test-1',
            name: 'Leaf',
            status: 'passed',
        })
        expect(test.countChildren()).toBe(0)
        expect(test.hasChildren()).toBe(false)
    })

    it('countChildren returns count for test with nested tests', () => {
        const test = new Test(createMockFramework(), {
            id: 'test-1',
            name: 'Parent',
            status: 'passed',
            tests: [
                { id: 'child-1', name: 'Child 1', status: 'passed' },
                { id: 'child-2', name: 'Child 2', status: 'passed' },
            ],
        })
        expect(test.countChildren()).toBe(2)
        expect(test.hasChildren()).toBe(true)
    })

    it('findTest returns undefined for non-existent child', () => {
        const test = new Test(createMockFramework(), {
            id: 'test-1',
            name: 'My Test',
            status: 'passed',
        })
        expect(test.findTest('nonexistent')).toBeUndefined()
    })

    it('findTest returns child test by id', () => {
        const test = new Test(createMockFramework(), {
            id: 'parent',
            name: 'Parent',
            status: 'passed',
            tests: [
                { id: 'child-1', name: 'Child 1', status: 'passed' },
                { id: 'child-2', name: 'Child 2', status: 'failed' },
            ],
        })
        const child = test.findTest('child-2')
        expect(child).toBeDefined()
        expect(child.getId()).toBe('child-2')
        expect(child.getName()).toBe('Child 2')
    })
})

describe('test mergeResults', () => {
    it('preserves existing first seen stat', () => {
        const firstDate = '2023-01-01T00:00:00.000Z'
        const test = new Test(createMockFramework(), {
            id: 'test-1',
            name: 'My Test',
            status: 'passed',
            stats: { first: firstDate },
        })
        expect(test.getResult().stats.first).toBe(firstDate)
    })

    it('sets first seen date for new test', () => {
        const before = new Date().toISOString()
        const test = new Test(createMockFramework(), {
            id: 'test-1',
            name: 'My Test',
            status: 'passed',
        })
        const after = new Date().toISOString()
        expect(test.getResult().stats.first).toBeDefined()
        expect(test.getResult().stats.first >= before).toBe(true)
        expect(test.getResult().stats.first <= after).toBe(true)
    })

    it('preserves other stats when setting first seen', () => {
        const test = new Test(createMockFramework(), {
            id: 'test-1',
            name: 'My Test',
            status: 'passed',
            stats: { custom: 'value' },
        })
        expect(test.getResult().stats.custom).toBe('value')
        expect(test.getResult().stats.first).toBeDefined()
    })
})

describe('test render and persist', () => {
    it('render omits tests key', () => {
        const test = new Test(createMockFramework(), {
            id: 'test-1',
            name: 'Parent',
            status: 'passed',
            tests: [
                { id: 'child-1', name: 'Child 1', status: 'passed' },
            ],
        })
        const rendered = test.render()
        expect(rendered.tests).toBeUndefined()
        expect(rendered.id).toBe('test-1')
    })

    it('render includes hasChildren and selected', () => {
        const test = new Test(createMockFramework(), {
            id: 'test-1',
            name: 'Parent',
            status: 'passed',
            tests: [
                { id: 'child-1', name: 'Child 1', status: 'passed' },
            ],
        })
        const rendered = test.render()
        expect(rendered.hasChildren).toBe(true)
        expect(rendered.selected).toBe(false)
    })

    it('render of leaf test has hasChildren false', () => {
        const test = new Test(createMockFramework(), {
            id: 'test-1',
            name: 'Leaf',
            status: 'passed',
        })
        const rendered = test.render()
        expect(rendered.hasChildren).toBe(false)
    })

    it('persist includes test defaults with idle status', () => {
        const test = new Test(createMockFramework(), {
            id: 'test-1',
            name: 'My Test',
            status: 'passed',
        })
        const persisted = test.persist()
        expect(persisted.id).toBe('test-1')
        expect(persisted.name).toBe('My Test')
        expect(persisted.status).toBe('idle')
    })

    it('persist with false preserves current status', () => {
        const test = new Test(createMockFramework(), {
            id: 'test-1',
            name: 'My Test',
            status: 'passed',
        })
        const persisted = test.persist(false)
        expect(persisted.status).toBe('passed')
    })

    it('defaults removes displayName when same as name', () => {
        const test = new Test(createMockFramework(), {
            id: 'test-1',
            name: 'Same Name',
            displayName: 'Same Name',
            status: 'passed',
        })
        const rendered = test.render()
        expect(rendered.displayName).toBeUndefined()
    })

    it('defaults preserves displayName when different from name', () => {
        const test = new Test(createMockFramework(), {
            id: 'test-1',
            name: 'test_name',
            displayName: 'Test Name',
            status: 'passed',
        })
        const rendered = test.render()
        expect(rendered.displayName).toBe('Test Name')
    })
})

describe('test debrief', () => {
    it('debrief updates stats.last', async () => {
        const test = new Test(createMockFramework(), {
            id: 'test-1',
            name: 'My Test',
            status: 'idle',
        })
        const before = new Date().toISOString()
        await test.debrief({
            id: 'test-1',
            name: 'My Test',
            status: 'passed',
        }, false)
        const after = new Date().toISOString()
        expect(test.getResult().stats.last).toBeDefined()
        expect(test.getResult().stats.last >= before).toBe(true)
        expect(test.getResult().stats.last <= after).toBe(true)
    })

    it('debrief calls setNuggetStatus', async () => {
        const framework = createMockFramework()
        const test = new Test(framework, {
            id: 'test-1',
            name: 'My Test',
            status: 'idle',
        })
        await test.debrief({
            id: 'test-1',
            name: 'My Test',
            status: 'passed',
        }, false)
        expect(framework.setNuggetStatus).toHaveBeenCalled()
    })

    it('debrief updates result status', async () => {
        const test = new Test(createMockFramework(), {
            id: 'test-1',
            name: 'My Test',
            status: 'idle',
        })
        await test.debrief({
            id: 'test-1',
            name: 'My Test',
            status: 'failed',
            feedback: 'Expected true to be false',
        }, false)
        expect(test.getResult().status).toBe('failed')
        expect(test.getResult().feedback).toBe('Expected true to be false')
    })
})

describe('test resetResult', () => {
    it('resetResult resets status to idle', () => {
        const test = new Test(createMockFramework(), {
            id: 'test-1',
            name: 'My Test',
            status: 'failed',
            feedback: 'Expected true to be false',
        })
        test.resetResult()
        const result = test.getResult()
        expect(result.status).toBe('idle')
    })

    it('resetResult preserves id and name', () => {
        const test = new Test(createMockFramework(), {
            id: 'test-1',
            name: 'My Test',
            status: 'failed',
        })
        test.resetResult()
        const result = test.getResult()
        expect(result.id).toBe('test-1')
        expect(result.name).toBe('My Test')
    })
})

describe('nugget behavior (via Test)', () => {
    it('freshness state', () => {
        const test = new Test(createMockFramework(), {
            id: 'test-1',
            name: 'My Test',
            status: 'passed',
        })
        expect(test.isFresh()).toBe(false)
        test.setFresh(true)
        expect(test.isFresh()).toBe(true)
        test.setFresh(false)
        expect(test.isFresh()).toBe(false)
    })

    it('selected defaults to false', () => {
        const test = new Test(createMockFramework(), {
            id: 'test-1',
            name: 'My Test',
            status: 'passed',
        })
        expect(test.selected).toBe(false)
    })

    it('expanded defaults to false', () => {
        const test = new Test(createMockFramework(), {
            id: 'test-1',
            name: 'My Test',
            status: 'passed',
        })
        expect(test.expanded).toBe(false)
    })

    it('toggleSelected inverts selected state', async () => {
        const test = new Test(createMockFramework(), {
            id: 'test-1',
            name: 'My Test',
            status: 'passed',
        })
        expect(test.selected).toBe(false)
        await test.toggleSelected()
        expect(test.selected).toBe(true)
        await test.toggleSelected()
        expect(test.selected).toBe(false)
    })

    it('toggleSelected with explicit value sets state', async () => {
        const test = new Test(createMockFramework(), {
            id: 'test-1',
            name: 'My Test',
            status: 'passed',
        })
        await test.toggleSelected(true)
        expect(test.selected).toBe(true)
        await test.toggleSelected(true)
        expect(test.selected).toBe(true)
        await test.toggleSelected(false)
        expect(test.selected).toBe(false)
    })

    it('toggleExpanded inverts expanded state', async () => {
        const test = new Test(createMockFramework(), {
            id: 'test-1',
            name: 'My Test',
            status: 'passed',
        })
        expect(test.expanded).toBe(false)
        await test.toggleExpanded()
        expect(test.expanded).toBe(true)
        await test.toggleExpanded()
        expect(test.expanded).toBe(false)
    })

    it('contextMenu returns empty array', () => {
        const test = new Test(createMockFramework(), {
            id: 'test-1',
            name: 'My Test',
            status: 'passed',
        })
        expect(test.contextMenu()).toEqual([])
    })

    it('canToggleTests returns false by default', () => {
        const test = new Test(createMockFramework(), {
            id: 'test-1',
            name: 'My Test',
            status: 'passed',
        })
        expect(test.canToggleTests()).toBe(false)
    })
})
