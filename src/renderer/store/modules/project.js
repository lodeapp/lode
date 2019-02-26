import { remote } from 'electron'

export default {
    namespaced: true,
    state: {
        project: JSON.parse(remote.getCurrentWindow().getProjectOptions())
    },
    mutations: {
        UPDATE (state, payload) {
            state.project = { ...state.project, ...JSON.parse(payload) }
        },
        REFRESH (state) {
            state.project = { ...state.project, ...JSON.parse(remote.getCurrentWindow().getProjectOptions()) }
        }
    },
    getters: {
        options: (state) => {
            return state.project
        },
        id: (state) => {
            return state.project.id
        },
        empty: (state) => {
            return !state.project.id
        },
        name: (state) => {
            return state.project.name
        }
    }
}
