import Vue from 'vue'
import _clone from 'lodash/clone'
import _last from 'lodash/last'

export default {
    namespaced: true,
    state: {
        active: null, // Active framework id, so switching can feel more responsive
        repository: null,
        framework: null,
        suitesKey: null,
        nuggets: [],
        persist: {}
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
        SUITES (state, payload) {
            state.suitesKey = Vue.prototype.$string.from(payload.map(suite => suite.file))
        },
        PERSIST_NUGGETS (state) {
            Vue.set(state.persist, state.active, state.nuggets)
        },
        SET_NUGGETS (state, payload) {
            state.nuggets = payload
        },
        CLEAR_NUGGETS (state) {
            state.nuggets = []
        },
        CLEAR (state) {
            state.active = null
            state.repository = null
            state.framework = null
            state.nuggets = []
        }
    },
    actions: {
        async activate ({ state, commit }, { frameworkId, repository }) {
            // If there's an active framework, persist active nuggets, if any.
            if (state.active) {
                commit('PERSIST_NUGGETS')
                commit('CLEAR_NUGGETS')
            }
            commit('ACTIVE', frameworkId)
            Lode.ipc.invoke('framework-get', frameworkId).then(framework => {
                commit('REPOSITORY', repository)
                commit('FRAMEWORK', framework)
                // Restore previously persisted nuggets, if applicable
                if (state.persist[framework.id]) {
                    commit('SET_NUGGETS', state.persist[framework.id])
                }
            })
            Lode.ipc.send('project-active-framework', frameworkId)
        },
        onRemove ({ state, commit, dispatch }, modelId) {
            if (state.repository.id === modelId || state.active === modelId) {
                commit('CLEAR')
            } else if (state.nuggets.indexOf(modelId) > -1) {
                commit('CLEAR_NUGGETS')
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
        suitesKey: state => {
            return state.suitesKey
        },
        inContext: state => id => {
            return state.nuggets.indexOf(id) > -1
        },
        rootPath: state => {
            if (!state.framework || !state.repository) {
                return ''
            }
            return state.framework.runsInRemote ? state.framework.remotePath : state.repository.path
        },
        repositoryPath: state => {
            if (!state.repository) {
                return ''
            }
            return state.repository.path
        }
    }
}
