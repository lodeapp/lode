import { createPinia, setActivePinia } from 'pinia'
import { useSettingsStore } from '@/stores/settings'

beforeEach(() => {
    setActivePinia(createPinia())
})

describe('settings store', () => {
    it('starts with empty state', () => {
        const store = useSettingsStore()
        expect(store.value()).toEqual({})
    })

    it('returns undefined for missing keys', () => {
        const store = useSettingsStore()
        expect(store.value('paneSizes')).toBeUndefined()
    })

    it('reads dynamically added properties after replace', () => {
        const store = useSettingsStore()
        store.replace({ paneSizes: [16, 44, 40], concurrency: 3 })
        expect(store.value('paneSizes')).toEqual([16, 44, 40])
        expect(store.value('concurrency')).toBe(3)
    })

    it('reads nested properties after replace', () => {
        const store = useSettingsStore()
        store.replace({ confirm: { switchProject: true } })
        expect(store.value('confirm.switchProject')).toBe(true)
    })

    it('reflects updated values after a second replace', () => {
        const store = useSettingsStore()
        store.replace({ paneSizes: [16, 44, 40] })
        store.replace({ paneSizes: [25, 35, 40] })
        expect(store.value('paneSizes')).toEqual([25, 35, 40])
    })

    it('returns the full state when called without a key', () => {
        const settings = { paneSizes: [16, 44, 40], userid: 'abc' }
        const store = useSettingsStore()
        store.replace(settings)
        expect(store.value()).toMatchObject(settings)
    })
})
