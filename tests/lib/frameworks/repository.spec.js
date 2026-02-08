import { Repository } from '@lib/frameworks/repository'
import { ApplicationWindow } from '@main/application-window'

vi.mock('@main/application-window')
vi.mock('@lib/state')
vi.mock('electron-store')
vi.mock('@lib/frameworks/factory')
vi.mock('@lib/process/queue')
vi.mock('node:fs', () => ({
    access: vi.fn((path, mode, callback) => callback(null)),
    constants: { R_OK: 4 },
}))
vi.mock('electron', () => ({
    dialog: { showOpenDialog: vi.fn() },
}))
vi.mock('glob', () => ({
    globSync: vi.fn().mockReturnValue([]),
}))

vi.useFakeTimers()

function createRepository(options = {}) {
    return new Repository(new ApplicationWindow(), {
        id: 'repo-1',
        path: '/path/to/repo',
        name: 'My Repo',
        ...options,
    })
}

describe('repository instantiation', () => {
    it('instantiates with required options', () => {
        const repo = createRepository()
        expect(repo.getId()).toBe('repo-1')
        expect(repo.getDisplayName()).toBe('My Repo')
        expect(repo.getPath()).toBe('/path/to/repo')
    })

    it('uses path basename as name when not provided', () => {
        const repo = createRepository({ name: undefined })
        expect(repo.getDisplayName()).toBe('repo')
    })

    it('defaults scanning to false', () => {
        const repo = createRepository()
        expect(repo.scanning).toBe(false)
    })

    it('defaults selected to false', () => {
        const repo = createRepository()
        expect(repo.selected).toBe(false)
    })
})

describe('repository expansion', () => {
    it('defaults expanded to true', () => {
        const repo = createRepository()
        expect(repo.isExpanded()).toBe(true)
    })

    it('respects expanded option', () => {
        const repo = createRepository({ expanded: false })
        expect(repo.isExpanded()).toBe(false)
    })

    it('expand sets expanded to true and emits change', () => {
        const repo = createRepository({ expanded: false })
        const spy = vi.fn()
        repo.on('change', spy)
        repo.expand()
        expect(repo.isExpanded()).toBe(true)
        expect(spy).toHaveBeenCalledTimes(1)
    })

    it('collapse sets expanded to false and emits change', () => {
        const repo = createRepository({ expanded: true })
        const spy = vi.fn()
        repo.on('change', spy)
        repo.collapse()
        expect(repo.isExpanded()).toBe(false)
        expect(spy).toHaveBeenCalledTimes(1)
    })
})

describe('repository frameworks', () => {
    it('empty returns true when no frameworks', () => {
        const repo = createRepository()
        expect(repo.empty()).toBe(true)
    })

    it('count returns 0 when no frameworks', () => {
        const repo = createRepository()
        expect(repo.count()).toBe(0)
    })

    it('getFrameworkById returns undefined for non-existent', () => {
        const repo = createRepository()
        expect(repo.getFrameworkById('nonexistent')).toBeUndefined()
    })

    it('removeFramework does nothing for non-existent id', () => {
        const repo = createRepository()
        expect(() => repo.removeFramework('nonexistent')).not.toThrow()
    })
})

describe('repository state queries', () => {
    it('isRunning returns false when no frameworks', () => {
        const repo = createRepository()
        expect(repo.isRunning()).toBe(false)
    })

    it('isRefreshing returns false when no frameworks', () => {
        const repo = createRepository()
        expect(repo.isRefreshing()).toBe(false)
    })

    it('isBusy returns false when no frameworks', () => {
        const repo = createRepository()
        expect(repo.isBusy()).toBe(false)
    })
})

describe('repository render and persist', () => {
    it('render returns expected fields', () => {
        const repo = createRepository()
        const rendered = repo.render()
        expect(rendered.id).toBe('repo-1')
        expect(rendered.name).toBe('My Repo')
        expect(rendered.path).toBe('/path/to/repo')
        expect(rendered.expanded).toBe(true)
        expect(rendered.status).toBeDefined()
    })

    it('persist omits status and includes frameworks', () => {
        const repo = createRepository()
        const persisted = repo.persist()
        expect(persisted.status).toBeUndefined()
        expect(persisted.frameworks).toEqual([])
    })

    it('persist includes id, name, path, expanded', () => {
        const repo = createRepository()
        const persisted = repo.persist()
        expect(persisted.id).toBe('repo-1')
        expect(persisted.name).toBe('My Repo')
        expect(persisted.path).toBe('/path/to/repo')
        expect(persisted.expanded).toBe(true)
    })
})

describe('repository events', () => {
    it('save emits change event', () => {
        const repo = createRepository()
        const spy = vi.fn()
        repo.on('change', spy)
        repo.save()
        expect(spy).toHaveBeenCalledTimes(1)
    })
})

describe('repository progress', () => {
    it('progress ledger starts at zero', () => {
        const repo = createRepository()
        expect(repo.getProgressLedger()).toEqual({ run: 0, total: 0 })
    })

    it('resetProgressLedger resets to zero', () => {
        const repo = createRepository()
        repo.resetProgressLedger()
        expect(repo.getProgressLedger()).toEqual({ run: 0, total: 0 })
    })
})

describe('repository exists', () => {
    it('resolves to true when directory is accessible', async () => {
        const repo = createRepository()
        const result = await repo.exists()
        expect(result).toBe(true)
    })
})
