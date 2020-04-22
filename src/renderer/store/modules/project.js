export default {
    namespaced: true,
    state: {},
    getters: {
        project (state) {
            return state.id ? {
                id: state.id,
                name: state.name,
                repositories: state.repositories || []
            } : null
        }
    }
}
