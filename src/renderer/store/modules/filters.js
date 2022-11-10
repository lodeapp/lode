import { get, identity, isArray, isEmpty, pickBy } from 'lodash'

export default {
    namespaced: true,
    state: {},
    mutations: {
        SET (state, { id, filters }) {
            // Set by merging current state and removing falsy or empty values
            state[id] = pickBy({
                ...get(state, id, {}),
                ...filters
            }, value => isArray(value) ? !isEmpty(value) : identity(value))
        },
        RESET (state) {
            Object.keys(state).forEach(id => {
                delete state[id]
            })
        }
    },
    getters: {
        all: state => id => {
            return state[id] || {}
        }
    }
}
