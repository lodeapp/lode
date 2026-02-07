import { createPinia, setActivePinia } from 'pinia'
import { useStatusStore } from '@/stores/status'

beforeEach(() => {
    setActivePinia(createPinia())
})

describe('status store', () => {
    it('starts with empty status map', () => {
        const store = useStatusStore()
        expect(store.status).toEqual({})
    })

    it('returns idle for unknown nugget ids', () => {
        const store = useStatusStore()
        expect(store.nugget('unknown-id')).toBe('idle')
    })

    it('sets the entire status map', () => {
        const store = useStatusStore()
        store.set({ 'test-1': 'passed', 'test-2': 'failed' })
        expect(store.nugget('test-1')).toBe('passed')
        expect(store.nugget('test-2')).toBe('failed')
    })

    it('replaces the entire map on set', () => {
        const store = useStatusStore()
        store.set({ 'test-1': 'passed' })
        store.set({ 'test-2': 'failed' })
        expect(store.nugget('test-1')).toBe('idle')
        expect(store.nugget('test-2')).toBe('failed')
    })

    it('merges statuses on update', () => {
        const store = useStatusStore()
        store.set({ 'test-1': 'passed', 'test-2': 'failed' })
        store.update({ 'test-2': 'running', 'test-3': 'queued' })
        expect(store.nugget('test-1')).toBe('passed')
        expect(store.nugget('test-2')).toBe('running')
        expect(store.nugget('test-3')).toBe('queued')
    })

    it('overwrites individual statuses on update', () => {
        const store = useStatusStore()
        store.set({ 'test-1': 'idle' })
        store.update({ 'test-1': 'passed' })
        expect(store.nugget('test-1')).toBe('passed')
    })
})
