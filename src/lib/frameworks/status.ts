import { uniq } from 'lodash'

/**
 * Possible statuses for tests.
 */
export type Status =
    | 'queued'
    | 'running'
    | 'passed'
    | 'failed'
    | 'incomplete'
    | 'skipped'
    | 'warning'
    | 'partial'
    | 'empty'
    | 'idle'
    | 'error'

/**
 * Possible statuses for frameworks.
 */
export type FrameworkStatus =
    | Status
    | 'refreshing'
    | 'loading'
    | 'missing'

/**
 * A ledger of statuses.
 */
export type StatusLedger = {
    [key in Status]: number
}

/**
 * A map of ids and their statuses.
 */
export type StatusMap = {
    [key: string]: Status
}

/**
 * Labels for each status
 */
export const labels = {
    empty: 'Empty',
    error: 'Error',
    failed: 'Failed',
    idle: 'Idle',
    incomplete: 'Incomplete',
    loading: 'Loading',
    missing: 'Missing',
    partial: 'Partial',
    passed: 'Passed',
    queued: 'Queued',
    refreshing: 'Refreshing',
    running: 'Running',
    skipped: 'Skipped',
    stopped: 'Stopped',
    warning: 'Warning'
}

/**
 * Compute an overarching generic status based on a set of statuses.
 *
 * @param components An array of statuses with which to compute the final one.
 */
export function parseStatus (components: Array<Status>): Status {
    // If no components were found, or every component is of status 'empty',
    // parent should be marked and 'empty', too.
    if (!components.length || components.every(component => component === 'empty')) {
        return 'empty'
    }

    // Exclude stray empty status before parsing all parts (e.g. all idle parts
    // with the occasional empty part should result in idle status, not partial).
    // We assume, therefore, than an empty part has no effect on the total
    // result. This goes against assuming empty parts should trigger a warning.
    components = components.filter(component => component !== 'empty')

    components = uniq(components)
    if (components.length === 1) {
        return components[0]
    }

    // If there are mixed queued and non-queued components, we'll consider the
    // final status as running, assuming this is transient because the status
    // will update again until queued components are run or process is stopped,
    // in which case we'll manually change from running to something else.
    if (components.includes('queued') || components.includes('running')) {
        return 'running'
    }

    if (components.includes('error')) {
        return 'error'
    }

    if (components.includes('failed')) {
        return 'failed'
    }

    if (components.includes('warning')) {
        return 'warning'
    }

    if (components.includes('incomplete') && !components.includes('idle')) {
        return 'incomplete'
    }

    // If components include a skipped test, we'll consider its parent as
    // incomplete. It's not obviously skipped, as something inside might've
    // been run. Marking it as partial, on the other hand, could be confusing,
    // as it's something we use for things that have run partially, i.e. not
    // activated by the user itself rather than activated and skipped by the
    // framework itself. Not 100% sure this is the right way to go, so we can
    // revisit this in the future with more experience and feedback.
    if (components.includes('skipped') && !components.includes('idle')) {
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
    if (!components.length || components.every(component => component === 'empty')) {
        return 'empty'
    }

    components = uniq(components)
    if (components.length === 1) {
        return components[0]
    }

    if (components.includes('loading')) {
        return 'loading'
    }

    if (components.includes('refreshing')) {
        return 'refreshing'
    }

    if (components.includes('missing')) {
        return 'error'
    }

    return parseStatus(components as Array<Status>)
}
