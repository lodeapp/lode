export default {
    namespaced: true,
    state: {
        ledger: {}
    },
    mutations: {
        SET (state, payload) {
            state.ledger = {}
            state.ledger = {
                ...state.ledger,
                ...payload
            }
        },
        UPDATE (state, payload) {
            state.ledger = {
                ...state.ledger,
                ...payload
            }
        }
    },
    getters: {
        ledger: state => {
            return state.ledger
        }
    }
}
