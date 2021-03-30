import app from '@'

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
                app.config.globalProperties.$modal.open('AlertStack', {}, () => {
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
