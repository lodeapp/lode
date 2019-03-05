export default {
    namespaced: true,
    state: {
        active: []
    },
    mutations: {
        ADD (state, payload) {
            state.active.push(payload)
        },
        CLEAR (state) {
            state.active = []
        }
    },
    actions: {
        onRemove: ({ state, commit, dispatch }, modelId) => {
            if (state.active.indexOf(modelId) > -1) {
                dispatch('test/clear', null, { root: true })
                commit('CLEAR')
            }
        }
    },
    getters: {
        active: (state) => {
            return state.active
        }
    }
}
