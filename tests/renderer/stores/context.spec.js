import { createPinia, setActivePinia } from 'pinia'
import { useContextStore } from '@/stores/context'

// Mock the global Lode.ipc used by the activate action
beforeEach(() => {
    setActivePinia(createPinia())
    globalThis.Lode = {
        ipc: {
            invoke: vi.fn().mockResolvedValue({ id: 'fw-1', runsInRemote: false }),
            send: vi.fn(),
        },
    }
})

afterEach(() => {
    delete globalThis.Lode
})

describe('context store', () => {
    describe('initial state', () => {
        it('starts with null active framework', () => {
            const store = useContextStore()
            expect(store.active).toBeNull()
        })

        it('starts with null repository and framework', () => {
            const store = useContextStore()
            expect(store.repository).toBeNull()
            expect(store.framework).toBeNull()
        })

        it('starts with empty nuggets', () => {
            const store = useContextStore()
            expect(store.nuggets).toEqual([])
        })
    })

    describe('test getter', () => {
        it('returns undefined when no nuggets', () => {
            const store = useContextStore()
            expect(store.test).toBeUndefined()
        })

        it('returns the last nugget', () => {
            const store = useContextStore()
            store.setNuggets(['nugget-1', 'nugget-2', 'nugget-3'])
            expect(store.test).toBe('nugget-3')
        })
    })

    describe('inContext getter', () => {
        it('returns false for nuggets not in context', () => {
            const store = useContextStore()
            expect(store.inContext('unknown')).toBe(false)
        })

        it('returns true for nuggets in context', () => {
            const store = useContextStore()
            store.setNuggets(['nugget-1', 'nugget-2'])
            expect(store.inContext('nugget-1')).toBe(true)
            expect(store.inContext('nugget-2')).toBe(true)
        })
    })

    describe('rootPath getter', () => {
        it('returns empty string when framework is null', () => {
            const store = useContextStore()
            expect(store.rootPath).toBe('')
        })

        it('returns repository path for local frameworks', () => {
            const store = useContextStore()
            store.setRepository({ id: 'repo-1', path: '/local/repo' })
            store.setFramework({ id: 'fw-1', runsInRemote: false, remotePath: '/remote/path' })
            expect(store.rootPath).toBe('/local/repo')
        })

        it('returns remote path for remote frameworks', () => {
            const store = useContextStore()
            store.setRepository({ id: 'repo-1', path: '/local/repo' })
            store.setFramework({ id: 'fw-1', runsInRemote: true, remotePath: '/remote/path' })
            expect(store.rootPath).toBe('/remote/path')
        })
    })

    describe('repositoryPath getter', () => {
        it('returns empty string when no repository', () => {
            const store = useContextStore()
            expect(store.repositoryPath).toBe('')
        })

        it('returns the repository path', () => {
            const store = useContextStore()
            store.setRepository({ id: 'repo-1', path: '/my/repo' })
            expect(store.repositoryPath).toBe('/my/repo')
        })
    })

    describe('actions', () => {
        it('sets the active framework id', () => {
            const store = useContextStore()
            store.setActive('fw-1')
            expect(store.active).toBe('fw-1')
        })

        it('clones the repository on set', () => {
            const store = useContextStore()
            const repo = { id: 'repo-1', path: '/repo' }
            store.setRepository(repo)
            // Should be a clone, not the same reference
            expect(store.repository).toEqual(repo)
            expect(store.repository).not.toBe(repo)
        })

        it('clones the framework on set', () => {
            const store = useContextStore()
            const fw = { id: 'fw-1', type: 'jest' }
            store.setFramework(fw)
            expect(store.framework).toEqual(fw)
            expect(store.framework).not.toBe(fw)
        })

        it('increments suitesKey on each setSuites call', () => {
            const store = useContextStore()
            expect(store.suitesKey).toBe(0)
            store.setSuites()
            expect(store.suitesKey).toBe(1)
            store.setSuites()
            expect(store.suitesKey).toBe(2)
        })

        it('sets nuggets', () => {
            const store = useContextStore()
            store.setNuggets(['n1', 'n2'])
            expect(store.nuggets).toEqual(['n1', 'n2'])
        })

        it('clears nuggets', () => {
            const store = useContextStore()
            store.setNuggets(['n1', 'n2'])
            store.clearNuggets()
            expect(store.nuggets).toEqual([])
        })

        it('persists and restores nuggets per framework', () => {
            const store = useContextStore()
            store.setActive('fw-1')
            store.setNuggets(['n1', 'n2'])
            store.persistNuggets()
            store.clearNuggets()
            expect(store.nuggets).toEqual([])
            expect(store.persist['fw-1']).toEqual(['n1', 'n2'])
        })
    })

    describe('onRemove', () => {
        it('clears everything when the active framework is removed', () => {
            const store = useContextStore()
            store.setActive('fw-1')
            store.setRepository({ id: 'repo-1', path: '/repo' })
            store.setFramework({ id: 'fw-1', type: 'jest' })
            store.setNuggets(['n1'])

            store.onRemove('fw-1')
            expect(store.active).toBeNull()
            expect(store.repository).toBeNull()
            expect(store.framework).toBeNull()
            expect(store.nuggets).toEqual([])
        })

        it('clears everything when the active repository is removed', () => {
            const store = useContextStore()
            store.setActive('fw-1')
            store.setRepository({ id: 'repo-1', path: '/repo' })
            store.setFramework({ id: 'fw-1', type: 'jest' })
            store.setNuggets(['n1'])

            store.onRemove('repo-1')
            expect(store.active).toBeNull()
            expect(store.repository).toBeNull()
        })

        it('clears only nuggets when a nugget in context is removed', () => {
            const store = useContextStore()
            store.setActive('fw-1')
            store.setRepository({ id: 'repo-1', path: '/repo' })
            store.setFramework({ id: 'fw-1', type: 'jest' })
            store.setNuggets(['n1', 'n2'])

            store.onRemove('n1')
            expect(store.active).toBe('fw-1')
            expect(store.repository).not.toBeNull()
            expect(store.nuggets).toEqual([])
        })
    })

    describe('clear', () => {
        it('resets all state', () => {
            const store = useContextStore()
            store.setActive('fw-1')
            store.setRepository({ id: 'repo-1', path: '/repo' })
            store.setFramework({ id: 'fw-1', type: 'jest' })
            store.setNuggets(['n1'])

            store.clear()
            expect(store.active).toBeNull()
            expect(store.repository).toBeNull()
            expect(store.framework).toBeNull()
            expect(store.nuggets).toEqual([])
        })
    })

    describe('activate', () => {
        it('sends IPC to set the active framework', async () => {
            const store = useContextStore()
            const repo = { id: 'repo-1', path: '/repo' }
            await store.activate({ frameworkId: 'fw-1', repository: repo })

            expect(Lode.ipc.send).toHaveBeenCalledWith('project-active-framework', 'fw-1')
        })

        it('invokes IPC to fetch framework details', async () => {
            const store = useContextStore()
            const repo = { id: 'repo-1', path: '/repo' }
            await store.activate({ frameworkId: 'fw-1', repository: repo })

            expect(Lode.ipc.invoke).toHaveBeenCalledWith('framework-get', 'fw-1')
        })

        it('persists previous nuggets before switching', async () => {
            const store = useContextStore()
            store.setActive('fw-old')
            store.setNuggets(['old-n1', 'old-n2'])

            await store.activate({
                frameworkId: 'fw-new',
                repository: { id: 'repo-1', path: '/repo' },
            })

            expect(store.persist['fw-old']).toEqual(['old-n1', 'old-n2'])
        })

        it('sets the active framework id immediately', async () => {
            const store = useContextStore()
            // Don't await — check synchronous behavior
            store.activate({
                frameworkId: 'fw-1',
                repository: { id: 'repo-1', path: '/repo' },
            })
            expect(store.active).toBe('fw-1')
        })
    })
})
