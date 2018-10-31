import { uniq } from 'lodash'

export type Status = 'passed' | 'failed' | 'incomplete' | 'skipped' | 'warning' | 'partial' | 'empty' | 'idle'

export type FrameworkStatus = Status | 'refreshing' | 'running' | 'stopped' | 'error'

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

    if (components.includes('stopped')) {
        return 'stopped'
    }

    if (components.includes('refreshing')) {
        return 'refreshing'
    }

    return parseStatus(components as Array<Status>)
}
