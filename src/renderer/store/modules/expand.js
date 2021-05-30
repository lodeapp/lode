export default {
    namespaced: true,
    state: {},
    mutations: {
        TOGGLE (state, identifier) {
            if (!state[identifier]) {
                state[identifier] = true
                return
            }
            delete state[identifier]
        },
        EXPAND (state, identifier) {
            state[identifier] = true
        },
        COLLAPSE (state, identifier) {
            delete state[identifier]
        }
    },
    actions: {
        toggle: ({ state, commit }, identifier) => {
            commit('TOGGLE', identifier)
        },
        expand: ({ state, commit }, identifier) => {
            commit('EXPAND', identifier)
        },
        collapse: ({ state, commit }, identifier) => {
            commit('COLLAPSE', identifier)
        }
    },
    getters: {
        expanded: state => id => {
            return !!state[id]
        }
    }
}
