import { uniq } from 'lodash'

export type Status = 'queued' | 'passed' | 'failed' | 'incomplete' | 'skipped' | 'warning' | 'partial' | 'empty' | 'idle'

export type FrameworkStatus = Status | 'refreshing' | 'running' | 'error'

/**
 * Compute an overarching generic status based on a set of statuses.
 *
 * @param components An array of statuses with which to compute the final one.
 */
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

/**
 * Compute an overarching framework status based on a set of statuses. This
 * differs slightly from @parseStatus only because frameworks support a few
 * additional statuses.
 *
 * @param components An array of statuses with which to compute the final one.
 */
export function parseFrameworkStatus (components: Array<FrameworkStatus>): FrameworkStatus {
    if (!components.length) {
        return 'empty'
    }

    components = uniq(components)
    if (components.length === 1) {
        return components[0]
    }

    if (components.includes('running')) {
        return 'running'
    }

    if (components.includes('error')) {
        return 'error'
    }

    if (components.includes('refreshing')) {
        return 'refreshing'
    }

    return parseStatus(components as Array<Status>)
}
