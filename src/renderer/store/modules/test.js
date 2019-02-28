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
    getters: {
        active: (state) => {
            return state.active
        }
    }
}