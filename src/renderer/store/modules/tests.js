import _cloneDeep from 'lodash/cloneDeep'

export default {
    namespaced: true,
    state: {
        active: null
    },
    mutations: {
        SHOW (state, test) {
            state.active = _cloneDeep(test)
        }
    },
    actions: {
        show: ({ state, commit }, test) => {
            commit('SHOW', test)
        }
    },
    getters: {
        active (state) {
            return state.active
        }
    }
}
