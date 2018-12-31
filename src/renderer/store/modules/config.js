import { remote } from 'electron'
import Config from 'electron-store'
import _cloneDeep from 'lodash/cloneDeep'
import _find from 'lodash/find'
import _findIndex from 'lodash/findIndex'
import _merge from 'lodash/merge'

const config = new Config()
const defaultSettings = {
    projects: [],
    currentProject: null
}

export default {
    namespaced: true,
    state: _merge(
        _cloneDeep(defaultSettings),
        _cloneDeep(config.store)
    ),
    mutations: {
        RESET (state) {
            config.clear()
        },
        ADD_PROJECT (state, project) {
            state.projects.push(project.persist())
            state.currentProject = project.id
            config.set(state)
        },
        ADD_REPOSITORY (state, repository) {
            const projectIndex = _findIndex(state.projects, { id: state.currentProject })
            state.projects[projectIndex].repositories.push(repository.persist())
            config.set(state)
        },
        ADD_FRAMEWORK (state, { repositoryId, framework }) {
            const projectIndex = _findIndex(state.projects, { id: state.currentProject })
            const repositoryIndex = _findIndex(state.projects[projectIndex].repositories, { id: repositoryId })
            state.projects[projectIndex].repositories[repositoryIndex].frameworks.push(framework.persist())
            config.set(state)
        },
        FRAMEWORK_CHANGE (state, { repositoryId, framework }) {
            try {
                const projectIndex = _findIndex(state.projects, { id: state.currentProject })
                const repositoryIndex = _findIndex(state.projects[projectIndex].repositories, { id: repositoryId })
                const frameworkIndex = _findIndex(state.projects[projectIndex].repositories[repositoryIndex].frameworks, { id: framework.id })
                if (projectIndex < 0 || repositoryIndex < 0 || frameworkIndex < 0) {
                    throw new Error()
                }
                config.set(
                    `projects.${projectIndex}.repositories.${repositoryIndex}.frameworks.${frameworkIndex}`,
                    framework.persist()
                )
            } catch (Error) {
                console.log('An error occurred while attempting to store the framework changes.', Error)
            }
        }
    },
    actions: {
        reset: ({ commit }) => {
            commit('RESET')
            remote.getCurrentWindow().reload()
        },
        addProject: ({ commit }, project) => {
            commit('ADD_PROJECT', project)
        },
        addRepository: ({ commit }, repository) => {
            commit('ADD_REPOSITORY', repository)
        },
        addFramework: ({ commit }, { repositoryId, framework }) => {
            commit('ADD_FRAMEWORK', { repositoryId, framework })
        },
        frameworkChange: ({ commit, getters }, { repositoryId, framework }) => {
            commit('FRAMEWORK_CHANGE', { repositoryId, framework })
        }
    },
    getters: {
        all: (state) => {
            return state
        },
        currentProject: (state, getters) => {
            let current = state.currentProject
            if (!state.projects.length) {
                return false
            } else if (state.projects.length && !current) {
                current = state.projects[0]
            }
            return _find(state.projects, { id: current })
        }
    }
}
