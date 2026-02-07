import { get, identity, isArray, isEmpty, pickBy } from 'lodash'
import { defineStore } from 'pinia'

export const useFiltersStore = defineStore('filters', {
    state: () => ({
        items: {},
    }),
    getters: {
        all: state => (id) => {
            return state.items[id] || {}
        },
    },
    actions: {
        set({ id, filters }) {
            // Set by merging current state and removing falsy or empty values
            this.items[id] = pickBy({
                ...get(this.items, id, {}),
                ...filters,
            }, value => isArray(value) ? !isEmpty(value) : identity(value))
        },
        reset() {
            this.items = {}
        },
    },
})
