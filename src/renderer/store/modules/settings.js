import _get from 'lodash/get'

export default {
    namespaced: true,
    state: {
    },
    getters: {
        value: state => key => {
            if (!key) {
                return state
            }
            return _get(state, key)
        }
    }
}
