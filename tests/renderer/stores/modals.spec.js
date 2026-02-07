// @vitest-environment jsdom
import { createPinia, setActivePinia } from 'pinia'
import { useModalsStore } from '@/stores/modals'

beforeEach(() => {
    setActivePinia(createPinia())
    document.body.classList.remove('modal-open')
})

describe('modals store', () => {
    it('starts with no modals', () => {
        const store = useModalsStore()
        expect(store.hasModals).toBe(false)
        expect(store.modals).toEqual([])
    })

    it('opens a modal', () => {
        const store = useModalsStore()
        store.open('Confirm')
        expect(store.hasModals).toBe(true)
        expect(store.isOpen('Confirm')).toBe(true)
    })

    it('considers only the topmost modal as open', () => {
        const store = useModalsStore()
        store.open('Confirm')
        store.open('Alert')
        expect(store.isOpen('Confirm')).toBe(false)
        expect(store.isOpen('Alert')).toBe(true)
    })

    it('does not push the same modal if it is already on top', () => {
        const store = useModalsStore()
        store.open('Confirm')
        store.open('Confirm')
        expect(store.modals).toEqual(['Confirm'])
    })

    it('allows pushing the same modal if it is not on top', () => {
        const store = useModalsStore()
        store.open('Confirm')
        store.open('Alert')
        store.open('Confirm')
        expect(store.modals).toEqual(['Confirm', 'Alert', 'Confirm'])
    })

    it('closes the topmost modal', () => {
        const store = useModalsStore()
        store.open('Confirm')
        store.open('Alert')
        store.close()
        expect(store.isOpen('Confirm')).toBe(true)
        expect(store.isOpen('Alert')).toBe(false)
    })

    it('clears all modals', () => {
        const store = useModalsStore()
        store.open('Confirm')
        store.open('Alert')
        store.clear()
        expect(store.hasModals).toBe(false)
        expect(store.modals).toEqual([])
    })

    it('adds modal-open class to body when modals are present', () => {
        const store = useModalsStore()
        store.open('Confirm')
        expect(document.body.classList.contains('modal-open')).toBe(true)
    })

    it('removes modal-open class from body when all modals are closed', () => {
        const store = useModalsStore()
        store.open('Confirm')
        store.close()
        expect(document.body.classList.contains('modal-open')).toBe(false)
    })

    it('removes modal-open class on clear', () => {
        const store = useModalsStore()
        store.open('Confirm')
        store.open('Alert')
        store.clear()
        expect(document.body.classList.contains('modal-open')).toBe(false)
    })
})
