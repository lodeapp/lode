import _cloneDeep from 'lodash/cloneDeep'
import _omit from 'lodash/omit'

export default {
    namespaced: true,
    state: {
        active: null,
        breadcrumbs: []
    },
    mutations: {
        SHOW (state, test) {
            state.active = _cloneDeep(
                // If test is in a transient state, omit potentially stale results.
                ['queued', 'running', 'idle'].includes(test.getStatus()) ? _omit(test, 'result') : test
            )
        },
        BREADCRUMBS (state, breadcrumb) {
            state.breadcrumbs.unshift({
                id: breadcrumb.id,
                name: breadcrumb.getDisplayName()
            })
        },
        RESET_BREADCRUMBS (state) {
            state.breadcrumbs = []
        },
        RESET (state) {
            state.active = null
        }
    },
    actions: {
        show: ({ commit }, test) => {
            commit('RESET_BREADCRUMBS')
            commit('SHOW', test)
        },
        breadcrumb: ({ commit }, breadcrumb) => {
            commit('BREADCRUMBS', breadcrumb)
        },
        reset ({ commit }) {
            commit('RESET')
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
