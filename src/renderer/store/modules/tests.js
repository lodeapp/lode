import _cloneDeep from 'lodash/cloneDeep'

export default {
    namespaced: true,
    state: {
        active: null,
        breadcrumbs: []
    },
    mutations: {
        SHOW (state, test) {
            state.active = _cloneDeep(test)
        },
        BREADCRUMBS (state, breadcrumb) {
            state.breadcrumbs.unshift(_cloneDeep(breadcrumb))
        },
        RESET_BREADCRUMBS (state) {
            state.breadcrumbs = []
        }
    },
    actions: {
        show: ({ commit }, test) => {
            commit('RESET_BREADCRUMBS')
            commit('SHOW', test)
        },
        breadcrumb: ({ commit }, breadcrumb) => {
            commit('BREADCRUMBS', breadcrumb)
        }
    },
    getters: {
        active (state) {
            return state.active
        },
        breadcrumbs (state) {
            return state.breadcrumbs
        }
    }
}
