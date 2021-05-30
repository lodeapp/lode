import _get from 'lodash/get'
import _identity from 'lodash/identity'
import _isArray from 'lodash/isArray'
import _isEmpty from 'lodash/isEmpty'
import _pickBy from 'lodash/pickBy'

export default {
    namespaced: true,
    state: {},
    mutations: {
        SET (state, { id, filters }) {
            // Set by merging current state and removing falsy or empty values
            state[id] = _pickBy({
                ..._get(state, id, {}),
                ...filters
            }, value => _isArray(value) ? !_isEmpty(value) : _identity(value))
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
