export default {
    namespaced: true,
    state: {
        active: '',
        context: []
    },
    mutations: {
        ADD (state, payload) {
            if (state.context.indexOf(payload) === -1) {
                state.context.unshift(payload)
            }
        },
        SET (state, payload) {
            const test = payload.pop()
            payload.forEach(context => {
                state.context.unshift(context)
            })
            state.active = test
        },
        TEST (state, payload) {
            state.active = payload
            state.context = []
        },
        CLEAR (state) {
            state.active = ''
            state.context = []
        }
    },
    actions: {
        onRemove: ({ state, commit, dispatch }, modelId) => {
            if (state.context.indexOf(modelId) > -1) {
                commit('CLEAR')
            }
        },
        clear: ({ commit }) => {
            commit('CLEAR')
        }
    },
    getters: {
        test: (state) => {
            return state.active
        },
        context: (state) => {
            return state.context
        },
        inContext: (state) => id => {
            return state.context.indexOf(id) > -1
        }
    }
}
