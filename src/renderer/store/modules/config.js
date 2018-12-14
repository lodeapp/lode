import Config from 'electron-store'
import _cloneDeep from 'lodash/cloneDeep'
import _get from 'lodash/get'
import _find from 'lodash/find'
import _findIndex from 'lodash/findIndex'
import _merge from 'lodash/merge'

const config = new Config()

export default {
    namespaced: true,
    state: {
        default: {
            projects: [],
            currentProject: null
        }
    },
    mutations: {
        UPDATE (state, payload) {
            config.set(payload)
        },
        FRAMEWORK_CHANGE (state, { project, repositoryId, framework }) {
            // @TODO: Projects, repositories and frameworks must exist before this can work properly.
            try {
                const projectIndex = _findIndex(config.store.projects, { id: project.id })
                const repositoryIndex = _findIndex(config.store.projects[projectIndex].repositories, { id: repositoryId })
                const frameworkIndex = _findIndex(config.store.projects[projectIndex].repositories[repositoryIndex].frameworks, { id: framework.id })
                console.log(projectIndex, repositoryIndex, frameworkIndex)
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
        update: ({ state, commit }, payload) => {
            commit('UPDATE', payload)
        },
        frameworkChange: ({ state, commit, getters }, { repositoryId, framework }) => {
            const project = getters.currentProject
            if (project) {
                commit('FRAMEWORK_CHANGE', { project, repositoryId, framework })
            }
        }
    },
    getters: {
        all: (state) => {
            return _merge(_cloneDeep(state.default), config.store)
        },
        settings: (state, getters) => key => {
            if (typeof key === 'undefined') {
                return getters.all
            }
            const setting = config.get(key)
            if (typeof setting === 'undefined') {
                return _get(_cloneDeep(state.default), key)
            }
            return setting
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
