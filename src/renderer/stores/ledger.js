import { defineStore } from 'pinia'

export const useLedgerStore = defineStore('ledger', {
    state: () => ({
        ledger: {},
    }),
    actions: {
        set(payload) {
            this.ledger = { ...payload }
        },
        update(payload) {
            this.ledger = {
                ...this.ledger,
                ...payload,
            }
        },
    },
})
