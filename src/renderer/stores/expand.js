import { defineStore } from 'pinia'

export const useExpandStore = defineStore('expand', {
    state: () => ({
        items: {},
    }),
    getters: {
        expanded: (state) => (id) => {
            return !!state.items[id]
        },
    },
    actions: {
        toggle(identifier) {
            if (!this.items[identifier]) {
                this.items[identifier] = true
                return
            }
            delete this.items[identifier]
        },
        expand(identifier) {
            this.items[identifier] = true
        },
        collapse(identifier) {
            delete this.items[identifier]
        },
        collapseAll() {
            this.items = {}
        },
    },
})
