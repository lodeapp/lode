import Vue from 'vue'
import _get from 'lodash/get'

export default {
    namespaced: true,
    state: {},
    mutations: {
        SET (state, { id, filters }) {
            Vue.set(state, id, {
                ..._get(state, id, {}),
                ...filters
            })
        },
        RESET (state) {
            Object.keys(state).forEach(id => {
                Vue.delete(state, id)
            })
        }
    },
    getters: {
        all: state => id => {
            return state[id] || {}
        }
    }
}
