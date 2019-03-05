export default {
    namespaced: true,
    state: {
        active: ''
    },
    mutations: {
        SET (state, payload) {
            state.active = payload
        },
        CLEAR (state) {
            state.active = ''
        }
    },
    actions: {
        clear: ({ commit }, modelId) => {
            commit('CLEAR')
        }
    },
    getters: {
        active: (state) => {
            return state.active
        }
    }
}
