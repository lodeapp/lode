export default {
    namespaced: true,
    state: {
        test: '',
        framework: '',
        breadcrumbs: []
    },
    mutations: {
        ADD (state, payload) {
            if (state.breadcrumbs.indexOf(payload) === -1) {
                state.breadcrumbs.unshift(payload)
            }
        },
        SET (state, payload) {
            const test = payload.pop()
            payload.forEach(breadcrumbs => {
                state.breadcrumbs.unshift(breadcrumbs)
            })
            state.test = test
        },
        TEST (state, payload) {
            state.test = payload
            state.breadcrumbs = []
        },
        FRAMEWORK (state, payload) {
            state.framework = payload
            state.breadcrumbs = []
        },
        CLEAR_FRAMEWORK (state) {
            state.framework = ''
            state.breadcrumbs = []
        },
        CLEAR (state) {
            state.test = ''
            state.breadcrumbs = []
        }
    },
    actions: {
        onRemove: ({ state, commit, dispatch }, modelId) => {
            if (state.breadcrumbs.indexOf(modelId) > -1) {
                commit('CLEAR')
            }
        },
        clear: ({ commit }) => {
            commit('CLEAR')
        }
    },
    getters: {
        test: (state) => {
            return state.test
        },
        framework: (state) => {
            return state.framework
        },
        breadcrumbs: (state) => {
            return state.breadcrumbs
        },
        inContext: (state) => id => {
            return state.breadcrumbs.indexOf(id) > -1
        }
    }
}
