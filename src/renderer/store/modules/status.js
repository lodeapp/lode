export default {
    namespaced: true,
    state: {
        status: {
            empty: 'Empty',
            error: 'Error',
            failed: 'Failed',
            idle: 'Idle',
            incomplete: 'Incomplete',
            partial: 'Partial',
            passed: 'Passed',
            refreshing: 'Refreshing',
            running: 'Running',
            stopped: 'Stopped',
            warning: 'Warning'
        }
    },
    getters: {
        display: (state) => status => {
            return state.status[status]
        }
    }
}
