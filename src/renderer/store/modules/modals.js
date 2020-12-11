import _last from 'lodash/last'

export default {
    namespaced: true,
    state: {
        modals: []
    },
    mutations: {
        ADD (state, name) {
            state.modals.push(name)
        },
        REMOVE (state) {
            state.modals.pop()
        },
        CLEAR (state) {
            state.modals = []
        }
    },
    actions: {
        open: ({ state, commit, dispatch, getters }, name) => {
            if (!getters['isOpen'](name)) {
                commit('ADD', name)
                dispatch('change')
            }
        },
        close: ({ state, commit, dispatch }) => {
            commit('REMOVE')
            dispatch('change')
        },
        clear: ({ state, commit, dispatch }) => {
            commit('CLEAR')
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
        isOpen: state => name => {
            return _last(state.modals) === name
        },
        hasModals: state => {
            return state.modals.length > 0
        },
        modals: state => {
            return state.modals
        }
    }
}
