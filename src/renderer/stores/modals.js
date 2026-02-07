import { last } from 'lodash'
import { defineStore } from 'pinia'

export const useModalsStore = defineStore('modals', {
    state: () => ({
        modals: [],
    }),
    getters: {
        isOpen: state => (name) => {
            return last(state.modals) === name
        },
        hasModals: (state) => {
            return state.modals.length > 0
        },
    },
    actions: {
        open(name) {
            if (!this.isOpen(name)) {
                this.modals.push(name)
                this.change()
            }
        },
        close() {
            this.modals.pop()
            this.change()
        },
        clear() {
            this.modals = []
            this.change()
        },
        change() {
            if (this.modals.length) {
                document.body.classList.add('modal-open')
                return
            }
            document.body.classList.remove('modal-open')
        },
    },
})
