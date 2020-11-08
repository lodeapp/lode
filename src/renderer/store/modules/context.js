import _clone from 'lodash/clone'
import _last from 'lodash/last'

export default {
    namespaced: true,
    state: {
        active: null, // Active framework id, so switching can feel more responsive
        repository: null,
        framework: null,
        nuggets: []
    },
    mutations: {
        ACTIVE (state, payload) {
            state.active = payload
        },
        REPOSITORY (state, payload) {
            state.repository = _clone(payload)
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
            state.active = null
            state.repository = null
            state.framework = null
            state.nuggets = []
        }
    },
    actions: {
        async activateWithId ({ state, commit }, { frameworkId, repository }) {
            commit('ACTIVE', frameworkId)
            Lode.ipc.invoke('framework-get', frameworkId).then(framework => {
                commit('REPOSITORY', repository)
                commit('FRAMEWORK', JSON.parse(framework))
            })
            Lode.ipc.send('project-active-framework', frameworkId)
        },
        async activate ({ state, commit }, { framework, repository }) {
            commit('ACTIVE', framework ? framework.id : null)
            commit('REPOSITORY', repository)
            commit('FRAMEWORK', framework)
            Lode.ipc.send('project-active-framework', framework ? framework.id : null)
        },
        onRemove ({ state, commit, dispatch }, modelId) {
            if (state.nuggets.indexOf(modelId) > -1) {
                commit('CLEAR')
            }
        },
        clear ({ commit }) {
            commit('CLEAR')
        }
    },
    getters: {
        active: state => {
            return state.active
        },
        repository: state => {
            return state.repository
        },
        framework: state => {
            return state.framework
        },
        nuggets: state => {
            return state.nuggets
        },
        test: state => {
            return _last(state.nuggets)
        },
        inContext: state => id => {
            return state.nuggets.indexOf(id) > -1
        }
    }
}
