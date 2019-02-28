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
    getters: {
        active: (state) => {
            return state.active
        }
    }
}
