import _cloneDeep from 'lodash/cloneDeep'

export default {
    namespaced: true,
    state: {
        active: null,
        breadcrumb: []
    },
    mutations: {
        SHOW (state, test) {
            state.active = _cloneDeep(test)
        },
        BREADCRUMB (state, breadcrumb) {
            state.breadcrumb.unshift(_cloneDeep(breadcrumb))
        },
        RESET_BREADCRUMB (state) {
            state.breadcrumb = []
        }
    },
    actions: {
        show: ({ commit }, test) => {
            commit('RESET_BREADCRUMB')
            commit('SHOW', test)
        },
        breadcrumb: ({ commit }, breadcrumb) => {
            commit('BREADCRUMB', breadcrumb)
        }
    },
    getters: {
        active (state) {
            return state.active
        },
        breadcrumb (state) {
            return state.breadcrumb
        }
    }
}
