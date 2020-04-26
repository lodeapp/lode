import Vue from 'vue'

export default {
    namespaced: true,
    state: {},
    mutations: {
        TOGGLE (state, identifier) {
            if (!state[identifier]) {
                Vue.set(state, identifier, true)
                return
            }
            Vue.delete(state, identifier)
        }
    },
    actions: {
        toggle: ({ state, commit }, identifier) => {
            commit('TOGGLE', identifier)
        }
    },
    getters: {
        expanded: (state) => id => {
            return !!state[id]
        }
    }
}
