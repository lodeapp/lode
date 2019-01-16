import _last from 'lodash/last'

export default {
    namespaced: true,
    state: {
        modals: []
    },
    mutations: {
        add (state, name) {
            state.modals.push(name)
        },
        remove (state) {
            state.modals.pop()
        },
        clear (state) {
            state.modals = []
        }
    },
    actions: {
        open: ({ state, commit, dispatch, getters }, name) => {
            if (!getters['isOpen'](name)) {
                commit('add', name)
                dispatch('change')
            }
        },
        close: ({ state, commit, dispatch }) => {
            commit('remove')
            dispatch('change')
        },
        clear: ({ state, commit, dispatch }) => {
            commit('clear')
            dispatch('change')
        },
        change: ({ state, commit }) => {
            if (state.modals.length) {
                document.body.classList.add('modal-open')
                return
            }
            document.body.classList.remove('modal-open')
        }
    },
    getters: {
        isOpen: (state) => name => {
            return _last(state.modals) === name
        },
        hasModals: (state) => {
            return state.modals.length > 0
        },
        modals: (state) => {
            return state.modals
        }
    }
}
