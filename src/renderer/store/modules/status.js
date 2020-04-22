export default {
    namespaced: true,
    state: {
        status: {}
    },
    mutations: {
        SET (state, payload) {
            state.status[payload.id] = payload.status
        }
    },
    actions: {
        set: ({ state, commit }, payload) => {
            commit('SET', payload)
        }
    },
    getters: {
        status: (state) => id => {
            return state.status[id] || 'idle'
        }
    }
}
