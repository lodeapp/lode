import { defineStore } from 'pinia'
import { get } from 'lodash'

export const useSettingsStore = defineStore('settings', {
    state: () => ({}),
    getters: {
        value: (state) => (key) => {
            if (!key) {
                return state
            }
            return get(state, key)
        },
    },
    actions: {
        replace(settings) {
            this.$state = settings
        },
    },
})
