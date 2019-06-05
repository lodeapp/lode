export default {
    namespaced: true,
    state: {
        status: {
            empty: 'Empty',
            error: 'Error',
            failed: 'Failed',
            idle: 'Idle',
            incomplete: 'Incomplete',
            loading: 'Loading',
            partial: 'Partial',
            passed: 'Passed',
            queued: 'Queued',
            refreshing: 'Refreshing',
            running: 'Running',
            skipped: 'Skipped',
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
