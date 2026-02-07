import { get } from 'lodash'
import { defineStore } from 'pinia'

export const useSettingsStore = defineStore('settings', {
    state: () => ({}),
    getters: {
        value: state => (key) => {
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
