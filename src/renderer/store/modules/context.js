import _clone from 'lodash/clone'
import _last from 'lodash/last'

export default {
    namespaced: true,
    state: {
        repository: null,
        framework: null,
        nuggets: []
    },
    mutations: {
        REPOSITORY (state, payload) {
            state.repository = _clone(payload)
            state.framework = null
        },
        FRAMEWORK (state, payload) {
            state.framework = _clone(payload)
        },
        NUGGET (state, payload) {
            if (state.nuggets.indexOf(payload) === -1) {
                state.nuggets.unshift(payload)
            }
        },
        CLEAR (state) {
            state.repository = null
            state.framework = null
            state.nuggets = []
        }
    },
    actions: {
        onRemove: ({ state, commit, dispatch }, modelId) => {
            if (state.nuggets.indexOf(modelId) > -1) {
                commit('CLEAR')
            }
        },
        clear: ({ commit }) => {
            commit('CLEAR')
        }
    },
    getters: {
        test: state => {
            return _last(state.nuggets)
        },
        repository: state => {
            return state.repository
        },
        framework: state => {
            return state.framework
        },
        frameworkContext: state => {
            return {
                repository: state.repository.id,
                framework: state.framework.id
            }
        },
        nuggets: state => {
            return state.nuggets
        },
        inContext: state => id => {
            return state.nuggets.indexOf(id) > -1
        }
    }
}
