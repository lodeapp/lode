export default {
    namespaced: true,
    state: {
        lastActive: ''
    },
    mutations: {
        SET_LAST_ACTIVE (state, payload) {
            state.lastActive = payload
        },
        CLEAR (state) {
            state.lastActive = ''
        }
    },
    actions: {
        setLastActive: ({ commit }, tab) => {
            commit('SET_LAST_ACTIVE', tab)
        },
        clear: ({ commit }) => {
            commit('CLEAR')
        }
    },
    getters: {
        lastActive: state => {
            return state.lastActive
        }
    }
}
