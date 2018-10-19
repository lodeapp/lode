import { uniq } from 'lodash'

export type Status = 'passed' | 'failed' | 'incomplete' | 'skipped' | 'warning' | 'partial' | 'empty' | 'idle'

export type FrameworkStatus = 'refreshing' | 'running' | 'stopped' | 'error' | Status

export function parseStatus (components: Array<Status>): Status {
    if (!components.length) {
        return 'empty'
    }

    components = uniq(components)
    if (components.length === 1) {
        return components[0]
    }

    if (components.includes('failed')) {
        return 'failed'
    }

    if (components.includes('warning')) {
        return 'warning'
    }

    if (components.includes('incomplete')) {
        return 'incomplete'
    }

    return 'partial'
}
