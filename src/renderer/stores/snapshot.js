import { defineStore } from 'pinia'

export const useSnapshotStore = defineStore('snapshot', {
    state: () => ({
        active: false,
        metadata: null,
        filePath: null,
    }),
    getters: {
        isReadOnly: state => state.active,
        fileName: (state) => {
            if (!state.filePath) {
                return null
            }
            const parts = state.filePath.split('/')
            return parts[parts.length - 1]
        },
    },
    actions: {
        activate(metadata, filePath) {
            this.active = true
            this.metadata = metadata
            this.filePath = filePath
        },
        deactivate() {
            this.active = false
            this.metadata = null
            this.filePath = null
        },
    },
})
