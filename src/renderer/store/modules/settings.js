import { get } from 'lodash'

export default {
    namespaced: true,
    state: {
    },
    getters: {
        value: state => key => {
            if (!key) {
                return state
            }
            return get(state, key)
        }
    }
}
