import _last from 'lodash/last'

export default {
    namespaced: true,
    state: {
        repository: '',
        framework: '',
        nuggets: []
    },
    mutations: {
        REPOSITORY (state, payload) {
            state.repository = payload
            state.framework = ''
        },
        FRAMEWORK (state, payload) {
            state.framework = payload
        },
        NUGGET (state, payload) {
            if (state.nuggets.indexOf(payload) === -1) {
                state.nuggets.unshift(payload)
            }
        },
        CLEAR (state) {
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
        test: (state) => {
            return _last(state.nuggets)
        },
        repository: (state) => {
            return state.repository
        },
        framework: (state) => {
            return state.framework
        },
        frameworkContext: (state) => {
            return {
                repository: state.repository,
                framework: state.framework
            }
        },
        nuggets: (state) => {
            return state.nuggets
        },
        inContext: (state) => id => {
            return state.nuggets.indexOf(id) > -1
        }
    }
}
