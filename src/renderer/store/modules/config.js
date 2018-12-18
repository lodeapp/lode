import { remote } from 'electron'
import Config from 'electron-store'
import _cloneDeep from 'lodash/cloneDeep'
import _get from 'lodash/get'
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
    state: _merge(_cloneDeep(defaultSettings), _cloneDeep(config.store)),
    mutations: {
        RESET (state) {
            config.clear()
        },
        ADD_PROJECT (state, project) {
            state.projects.push(project.persist())
            state.currentProject = project.id
            config.set(state)
        },
        FRAMEWORK_CHANGE (state, { project, repositoryId, framework }) {
            // @TODO: Projects, repositories and frameworks must exist before this can work properly.
            try {
                const projectIndex = _findIndex(config.store.projects, { id: project.id })
                const repositoryIndex = _findIndex(config.store.projects[projectIndex].repositories, { id: repositoryId })
                const frameworkIndex = _findIndex(config.store.projects[projectIndex].repositories[repositoryIndex].frameworks, { id: framework.id })
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
        frameworkChange: ({ commit, getters }, { repositoryId, framework }) => {
            const project = getters.currentProject
            if (project) {
                commit('FRAMEWORK_CHANGE', { project, repositoryId, framework })
            }
        },
        addProject: ({ commit }, project) => {
            commit('ADD_PROJECT', project)
        }
    },
    getters: {
        all: (state) => {
            return state
        },
        settings: (state, getters) => key => {
            if (typeof key === 'undefined') {
                return getters.all
            }
            return _get(state, key)
        },
        currentProject: (state, getters) => {
            const projects = getters.settings('projects')
            let current = getters.settings('currentProject')
            if (!projects.length) {
                return false
            } else if (projects.length && !current) {
                current = projects[0]
            }
            return _find(projects, { id: current })
        },
        repositories: (state, getters) => {
            const project = getters.currentProject
            if (project) {
                return _get(project, 'repositories', [])
            }

            return []
        },
        frameworks: (state, getters) => repositoryId => {
            const repository = _find(getters.repositories, { id: repositoryId })
            if (repository) {
                return _get(repository, 'frameworks', [])
            }

            return []
        }
    }
}
