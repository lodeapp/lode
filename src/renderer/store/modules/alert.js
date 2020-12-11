import Vue from 'vue'

export default {
    namespaced: true,
    state: {
        alerts: []
    },
    mutations: {
        ADD (state, payload) {
            state.alerts.push(payload)
        },
        REMOVE (state) {
            state.alerts.pop()
        },
        CLEAR (state) {
            state.alerts = []
        }
    },
    actions: {
        show: ({ state, commit }, payload) => {
            commit('ADD', payload)
            if (state.alerts.length === 1) {
                Vue.prototype.$modal.open('AlertStack', {}, () => {
                    commit('CLEAR')
                })
            }
        },
        hide: ({ commit }) => {
            commit('REMOVE')
        },
        clear: ({ commit }) => {
            commit('CLEAR')
        }
    },
    getters: {
        alerts: state => {
            return state.alerts
        }
    }
}
