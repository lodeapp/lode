export default {
    namespaced: true,
    state: {
        selective: false
    },
    mutations: {
        TOGGLE_SELECTIVE (state, toggle) {
            state.selective = toggle
        }
    },
    actions: {
        toggleSelective: ({ state, commit }, toggle) => {
            commit('TOGGLE_SELECTIVE', typeof toggle === 'undefined' ? !state.selective : toggle)
        },
        enableSelective: ({ commit }) => {
            commit('TOGGLE_SELECTIVE', true)
        },
        disableSelective: ({ commit }) => {
            commit('TOGGLE_SELECTIVE', false)
        }
    },
    getters: {
        selective (state) {
            return state.selective
        }
    }
}
