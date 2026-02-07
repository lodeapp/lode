import { defineStore } from 'pinia'

export const useTabsStore = defineStore('tabs', {
    state: () => ({
        lastActive: '',
    }),
    actions: {
        setLastActive(tab) {
            this.lastActive = tab
        },
        clear() {
            this.lastActive = ''
        },
    },
})
