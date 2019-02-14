import { Config } from '@main/lib/config'
import { Logger } from '@main/lib/logger'
import _find from 'lodash/find'
import _findIndex from 'lodash/findIndex'

export default {
    namespaced: true,
    state: {
        projects: Config.get('projects'),
        currentProject: Config.get('currentProject')
    },
    mutations: {
        ADD_PROJECT (state, project) {
            state.projects.push(project.persist())
            state.currentProject = project.id
            Config.save(state)
        },
        REMOVE_PROJECT (state, project) {
            const projectIndex = _findIndex(state.projects, { id: state.currentProject })
            state.projects.splice(projectIndex, 1)
            // After removing project, switch to left adjacent project, or reset
            const index = Math.max(0, (projectIndex - 1))
            state.currentProject = typeof state.projects[index] !== 'undefined' ? state.projects[index].id : null
            Config.save(state)
        },
        SWITCH_PROJECT (state, projectId) {
            state.currentProject = projectId
            Config.save(state)
        },
        PROJECT_CHANGE (state, project) {
            const projectIndex = _findIndex(state.projects, { id: state.currentProject })
            state.projects[projectIndex] = project.persist()
            Config.save(state)
        },
        ADD_REPOSITORY (state, repository) {
            const projectIndex = _findIndex(state.projects, { id: state.currentProject })
            state.projects[projectIndex].repositories.push(repository.persist())
            Config.save(state)
        },
        REMOVE_REPOSITORY (state, repository) {
            const projectIndex = _findIndex(state.projects, { id: state.currentProject })
            const repositoryIndex = _findIndex(state.projects[projectIndex].repositories, { id: repository.id })
            state.projects[projectIndex].repositories.splice(repositoryIndex, 1)
            Config.save(state)
        },
        REPOSITORY_CHANGE (state, repository) {
            const projectIndex = _findIndex(state.projects, { id: state.currentProject })
            const repositoryIndex = _findIndex(state.projects[projectIndex].repositories, { id: repository.id })
            state.projects[projectIndex].repositories[repositoryIndex] = repository.persist()
            Config.save(state)
        },
        ADD_FRAMEWORK (state, { repositoryId, framework }) {
            const projectIndex = _findIndex(state.projects, { id: state.currentProject })
            const repositoryIndex = _findIndex(state.projects[projectIndex].repositories, { id: repositoryId })
            state.projects[projectIndex].repositories[repositoryIndex].frameworks.push(framework.persist())
            Config.save(state)

            // Attempt to load tests after adding a framework
            framework.refresh()
        },
        FRAMEWORK_CHANGE (state, { repositoryId, framework }) {
            try {
                const projectIndex = _findIndex(state.projects, { id: state.currentProject })
                const repositoryIndex = _findIndex(state.projects[projectIndex].repositories, { id: repositoryId })
                const frameworkIndex = _findIndex(state.projects[projectIndex].repositories[repositoryIndex].frameworks, { id: framework.id })
                if (projectIndex < 0 || repositoryIndex < 0 || frameworkIndex < 0) {
                    throw new Error()
                }
                state.projects[projectIndex].repositories[repositoryIndex].frameworks[frameworkIndex] = framework.persist()
                Config.save(state)
            } catch (Error) {
                Logger.info.log('An error occurred while attempting to store the framework changes.', Error)
            }
        }
    },
    actions: {
        addProject: ({ commit, dispatch }, project) => {
            dispatch('tests/reset', null, { root: true })
            commit('ADD_PROJECT', project)
        },
        removeProject: ({ commit, dispatch }, project) => {
            dispatch('tests/reset', null, { root: true })
            commit('REMOVE_PROJECT', project)
        },
        switchProject: ({ commit, dispatch }, projectId) => {
            dispatch('tests/reset', null, { root: true })
            commit('SWITCH_PROJECT', projectId)
        },
        projectChange: ({ commit }, project) => {
            commit('PROJECT_CHANGE', project)
        },
        addRepository: ({ commit }, repository) => {
            commit('ADD_REPOSITORY', repository)
        },
        removeRepository: ({ commit, dispatch, rootGetters }, repository) => {
            commit('REMOVE_REPOSITORY', repository)
        },
        repositoryChange: ({ commit }, repository) => {
            commit('REPOSITORY_CHANGE', repository)
        },
        addFramework: ({ commit }, { repositoryId, framework }) => {
            commit('ADD_FRAMEWORK', { repositoryId, framework })
        },
        removeFramework: ({ commit, dispatch, rootGetters }, { repository, frameworkId }) => {
            repository.removeFramework(frameworkId)
            commit('REPOSITORY_CHANGE', repository)
        },
        frameworkChange: ({ commit, getters }, { repositoryId, framework }) => {
            commit('FRAMEWORK_CHANGE', { repositoryId, framework })
        }
    },
    getters: {
        hasProjects: (state) => {
            return state.projects.length > 0
        },
        currentProject: (state) => {
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
