export default {
    namespaced: true,
    state: {
        expanded: {}
    },
    mutations: {
        TOGGLE (state, payload) {
            state.expanded = {
                ...state.expanded,
                [payload.id]: !state.expanded[payload.id]
            }
        }
    },
    actions: {
        toggle: ({ state, commit }, payload) => {
            commit('TOGGLE', payload)
        }
    },
    getters: {
        expanded: (state) => id => {
            return !!state.expanded[id]
        }
    }
}
