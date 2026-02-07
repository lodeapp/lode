import { get } from 'lodash'
import { defineStore } from 'pinia'

export const useStatusStore = defineStore('status', {
    state: () => ({
        status: {},
    }),
    getters: {
        nugget: state => (nuggetId) => {
            return get(state.status, nuggetId, 'idle')
        },
    },
    actions: {
        set(payload) {
            this.status = { ...payload }
        },
        update(payload) {
            this.status = {
                ...this.status,
                ...payload,
            }
        },
    },
})
