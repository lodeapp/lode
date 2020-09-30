import _clone from 'lodash/clone'
import _last from 'lodash/last'
import { ipcRenderer } from 'electron'

export default {
    namespaced: true,
    state: {
        // Active framework id, so switching can feel more responsive
        active: null,
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
            state.active = null
            state.repository = null
            state.framework = null
            state.nuggets = []
        }
    },
    actions: {
        async activateWithId ({ state, commit }, { frameworkId, repository }) {
            commit('ACTIVE', frameworkId)
            ipcRenderer.invoke('framework-get', { repository: repository.id, framework: frameworkId }).then(framework => {
                commit('REPOSITORY', repository)
                commit('FRAMEWORK', JSON.parse(framework))
            })
            ipcRenderer.send('project-active-framework', frameworkId)
        },
        async activate ({ state, commit }, { framework, repository }) {
            commit('ACTIVE', framework.id)
            commit('REPOSITORY', repository)
            commit('FRAMEWORK', framework)
            ipcRenderer.send('project-active-framework', framework.id)
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
        frameworkContext: state => {
            return {
                repository: state.repository.id,
                framework: state.framework.id
            }
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
