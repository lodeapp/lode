export default {
    namespaced: true,
    state: {
        active: '',
        context: []
    },
    mutations: {
        SET (state, payload) {
            state.active = payload
            state.context = []
        },
        ADD_CONTEXT (state, payload) {
            state.context.unshift(payload)
        },
        CLEAR (state) {
            state.active = ''
            state.context = []
        }
    },
    actions: {
        onRemove: ({ state, commit, dispatch }, modelId) => {
            if (state.context.indexOf(modelId) > -1) {
                commit('CLEAR')
            }
        },
        clear: ({ commit }, modelId) => {
            commit('CLEAR')
        }
    },
    getters: {
        active: (state) => {
            return state.active
        },
        context: (state) => {
            return state.context
        }
    }
}
