import Config from 'electron-store'
import _cloneDeep from 'lodash/cloneDeep'
import _get from 'lodash/get'
import _find from 'lodash/find'
import _merge from 'lodash/merge'

const config = new Config()

export default {
    namespaced: true,
    state: {
        default: {
            projects: [],
            repositories: [],
            frameworks: [],
            currentProject: null
            // projects: [{
            //     id: '1',
            //     name: 'Amiqus ID'
            // }],
            // repositories: [{
            //     id: '2',
            //     path: '/Users/tomasbuteler/Sites/Amiqus/aqid',
            //     project: '1'
            // }],
            // frameworks: [
            //     {
            //         type: 'jest',
            //         command: 'yarn tests',
            //         path: `/tests/assets/js`,
            //         runner: 'yarn',
            //         // vmPath: '/aml/tests/assets/js',
            //         repository: '2'
            //     },
            //     {
            //         type: 'phpunit',
            //         command: 'depot test',
            //         path: '',
            //         vmPath: '/aml/tests',
            //         repository: '2'
            //     }
            // ],
            // currentProject: '1'
        }
    },
    mutations: {
        UPDATE (state, payload) {
            config.set(payload)
        }
    },
    actions: {
        update: ({ state, commit }, payload) => {
            commit('UPDATE', payload)
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
        }
    }
}
