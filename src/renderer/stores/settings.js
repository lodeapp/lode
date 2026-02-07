import { get } from 'lodash'
import { defineStore } from 'pinia'

export const useSettingsStore = defineStore('settings', {
    state: () => ({}),
    getters: {
        value() {
            return (key) => {
                if (!key) {
                    return this.$state
                }
                return get(this.$state, key)
            }
        },
    },
    actions: {
        replace(settings) {
            this.$state = settings
        },
    },
})
