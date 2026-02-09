import { createPinia, setActivePinia } from 'pinia'
import { useExpandStore } from '@/stores/expand'

beforeEach(() => {
    setActivePinia(createPinia())
})

describe('expand store', () => {
    it('starts with no expanded items', () => {
        const store = useExpandStore()
        expect(store.items).toEqual({})
    })

    it('reports unknown items as not expanded', () => {
        const store = useExpandStore()
        expect(store.expanded('unknown')).toBe(false)
    })

    it('expands an item', () => {
        const store = useExpandStore()
        store.expand('suite-1')
        expect(store.expanded('suite-1')).toBe(true)
    })

    it('collapses an item', () => {
        const store = useExpandStore()
        store.expand('suite-1')
        store.collapse('suite-1')
        expect(store.expanded('suite-1')).toBe(false)
    })

    it('toggles an item from collapsed to expanded', () => {
        const store = useExpandStore()
        store.toggle('suite-1')
        expect(store.expanded('suite-1')).toBe(true)
    })

    it('toggles an item from expanded to collapsed', () => {
        const store = useExpandStore()
        store.expand('suite-1')
        store.toggle('suite-1')
        expect(store.expanded('suite-1')).toBe(false)
    })

    it('collapses all items', () => {
        const store = useExpandStore()
        store.expand('suite-1')
        store.expand('suite-2')
        store.expand('suite-3')
        store.collapseAll()
        expect(store.expanded('suite-1')).toBe(false)
        expect(store.expanded('suite-2')).toBe(false)
        expect(store.expanded('suite-3')).toBe(false)
    })

    it('collapses only items belonging to a specific framework', () => {
        const store = useExpandStore()
        store.expand('fw-1:suite-1')
        store.expand('fw-1:suite-2')
        store.expand('fw-2:suite-1')
        store.expand('fw-2:suite-3')
        store.collapseAllInFramework('fw-1')
        expect(store.expanded('fw-1:suite-1')).toBe(false)
        expect(store.expanded('fw-1:suite-2')).toBe(false)
        expect(store.expanded('fw-2:suite-1')).toBe(true)
        expect(store.expanded('fw-2:suite-3')).toBe(true)
    })

    it('does not collapse items from other frameworks with similar prefixes', () => {
        const store = useExpandStore()
        store.expand('fw-1:suite-1')
        store.expand('fw-10:suite-1')
        store.collapseAllInFramework('fw-1')
        expect(store.expanded('fw-1:suite-1')).toBe(false)
        expect(store.expanded('fw-10:suite-1')).toBe(true)
    })

    it('manages items independently', () => {
        const store = useExpandStore()
        store.expand('suite-1')
        store.expand('suite-2')
        store.collapse('suite-1')
        expect(store.expanded('suite-1')).toBe(false)
        expect(store.expanded('suite-2')).toBe(true)
    })
})
