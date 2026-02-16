import { clone, last } from 'lodash'
import { defineStore } from 'pinia'

export const useContextStore = defineStore('context', {
    state: () => ({
        active: null, // Active framework id, so switching can feel more responsive
        repository: null,
        framework: null,
        suitesKey: 0,
        nuggets: [],
        persist: {},
    }),
    getters: {
        test: (state) => {
            return last(state.nuggets)
        },
        inContext: state => (id) => {
            return state.nuggets.includes(id)
        },
        rootPath: (state) => {
            if (!state.framework || !state.repository) {
                return ''
            }
            return state.framework.runsInRemote ? state.framework.remotePath : state.repository.path
        },
        repositoryPath: (state) => {
            if (!state.repository) {
                return ''
            }
            return state.repository.path
        },
    },
    actions: {
        setActive(frameworkId) {
            this.active = frameworkId
        },
        setRepository(repository) {
            this.repository = clone(repository)
        },
        setFramework(framework) {
            this.framework = clone(framework)
        },
        setSuites() {
            this.suitesKey++
        },
        persistNuggets() {
            this.persist[this.active] = this.nuggets
        },
        setNuggets(nuggets) {
            this.nuggets = nuggets
        },
        clearNuggets() {
            this.nuggets = []
        },
        async activate({ frameworkId, repository }) {
            // If there's an active framework, persist active nuggets, if any.
            if (this.active) {
                this.persistNuggets()
                this.clearNuggets()
            }
            this.setActive(frameworkId)
            Lode.ipc.invoke('framework-get', frameworkId).then((framework) => {
                this.setRepository(repository)
                this.setFramework(framework)
                // Restore previously persisted nuggets, if applicable
                if (this.persist[framework.id]) {
                    this.setNuggets(this.persist[framework.id])
                }
            })
            Lode.ipc.send('project-active-framework', frameworkId)
        },
        onRemove(modelId) {
            if (this.repository.id === modelId || this.active === modelId) {
                this.clear()
            }
            else if (this.nuggets.includes(modelId)) {
                this.clearNuggets()
            }
        },
        clear() {
            this.active = null
            this.repository = null
            this.framework = null
            this.nuggets = []
        },
    },
})
