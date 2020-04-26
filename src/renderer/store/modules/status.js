export default {
    namespaced: true,
    state: {
    },
    mutations: {
        SET (state, payload) {
            state[payload.id] = payload.status
        }
    },
    actions: {
        set: ({ state, commit }, payload) => {
            commit('SET', payload)
        }
    },
    getters: {
        status: (state) => id => {
            return state[id] || 'idle'
        }
    }
}
