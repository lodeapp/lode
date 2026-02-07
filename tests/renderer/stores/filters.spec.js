import { createPinia, setActivePinia } from 'pinia'
import { useFiltersStore } from '@/stores/filters'

beforeEach(() => {
    setActivePinia(createPinia())
})

describe('filters store', () => {
    it('starts with empty items', () => {
        const store = useFiltersStore()
        expect(store.items).toEqual({})
    })

    it('returns empty object for unknown framework id', () => {
        const store = useFiltersStore()
        expect(store.all('unknown')).toEqual({})
    })

    it('sets filters for a framework', () => {
        const store = useFiltersStore()
        store.set({ id: 'fw-1', filters: { keyword: 'login' } })
        expect(store.all('fw-1')).toEqual({ keyword: 'login' })
    })

    it('merges new filters with existing ones', () => {
        const store = useFiltersStore()
        store.set({ id: 'fw-1', filters: { keyword: 'login' } })
        store.set({ id: 'fw-1', filters: { status: ['passed'] } })
        expect(store.all('fw-1')).toEqual({ keyword: 'login', status: ['passed'] })
    })

    it('removes falsy values when setting filters', () => {
        const store = useFiltersStore()
        store.set({ id: 'fw-1', filters: { keyword: 'login' } })
        store.set({ id: 'fw-1', filters: { keyword: '' } })
        expect(store.all('fw-1')).toEqual({})
    })

    it('removes empty arrays when setting filters', () => {
        const store = useFiltersStore()
        store.set({ id: 'fw-1', filters: { status: ['passed'] } })
        store.set({ id: 'fw-1', filters: { status: [] } })
        expect(store.all('fw-1')).toEqual({})
    })

    it('keeps non-empty arrays when setting filters', () => {
        const store = useFiltersStore()
        store.set({ id: 'fw-1', filters: { status: ['passed', 'failed'] } })
        expect(store.all('fw-1')).toEqual({ status: ['passed', 'failed'] })
    })

    it('manages filters independently per framework', () => {
        const store = useFiltersStore()
        store.set({ id: 'fw-1', filters: { keyword: 'login' } })
        store.set({ id: 'fw-2', filters: { keyword: 'auth' } })
        expect(store.all('fw-1')).toEqual({ keyword: 'login' })
        expect(store.all('fw-2')).toEqual({ keyword: 'auth' })
    })

    it('resets all filters', () => {
        const store = useFiltersStore()
        store.set({ id: 'fw-1', filters: { keyword: 'login' } })
        store.set({ id: 'fw-2', filters: { keyword: 'auth' } })
        store.reset()
        expect(store.all('fw-1')).toEqual({})
        expect(store.all('fw-2')).toEqual({})
    })
})
