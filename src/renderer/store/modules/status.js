import _get from 'lodash/get'

export default {
    namespaced: true,
    state: {
        status: {}
    },
    mutations: {
        SET (state, payload) {
            state.status = {}
            state.status = {
                ...state.status,
                ...payload
            }
        },
        UPDATE (state, payload) {
            state.status = {
                ...state.status,
                ...payload
            }
        }
    },
    getters: {
        nugget: state => nugget => {
            return _get(state.status, nugget, 'idle')
        }
    }
}
