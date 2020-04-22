import { uniq } from 'lodash'

declare type STATUSMAP = {
    EMPTY: 'empty'
    ERROR: 'error'
    FAILED: 'failed'
    IDLE: 'idle'
    INCOMPLETE: 'incomplete'
    LOADING: 'loading'
    MISSING: 'missing'
    PARTIAL: 'partial'
    PASSED: 'passed'
    QUEUED: 'queued'
    REFRESHING: 'refreshing'
    RUNNING: 'running'
    SKIPPED: 'skipped'
    STOPPED: 'stopped'
    WARNING: 'warning'
}

export const STATUS: STATUSMAP = {
    EMPTY: 'empty',
    ERROR: 'error',
    FAILED: 'failed',
    IDLE: 'idle',
    INCOMPLETE: 'incomplete',
    LOADING: 'loading',
    MISSING: 'missing',
    PARTIAL: 'partial',
    PASSED: 'passed',
    QUEUED: 'queued',
    REFRESHING: 'refreshing',
    RUNNING: 'running',
    SKIPPED: 'skipped',
    STOPPED: 'stopped',
    WARNING: 'warning'
}

/**
 * Possible statuses for tests.
 */
export type Status =
    | STATUSMAP['QUEUED']
    | STATUSMAP['RUNNING']
    | STATUSMAP['PASSED']
    | STATUSMAP['FAILED']
    | STATUSMAP['INCOMPLETE']
    | STATUSMAP['SKIPPED']
    | STATUSMAP['WARNING']
    | STATUSMAP['PARTIAL']
    | STATUSMAP['EMPTY']
    | STATUSMAP['IDLE']
    | STATUSMAP['ERROR']

/**
 * Possible statuses for frameworks.
 */
export type FrameworkStatus =
    | Status
    | STATUSMAP['REFRESHING']
    | STATUSMAP['LOADING']
    | STATUSMAP['MISSING']

/**
 * A ledger of statuses.
 */
export type StatusLedger = {
    [key in Status]: number
}

/**
 * Labels for each status
 */
export const labels = {
    [STATUS.EMPTY]: 'Empty',
    [STATUS.ERROR]: 'Error',
    [STATUS.FAILED]: 'Failed',
    [STATUS.IDLE]: 'Idle',
    [STATUS.INCOMPLETE]: 'Incomplete',
    [STATUS.LOADING]: 'Loading',
    [STATUS.MISSING]: 'Missing',
    [STATUS.PARTIAL]: 'Partial',
    [STATUS.PASSED]: 'Passed',
    [STATUS.QUEUED]: 'Queued',
    [STATUS.REFRESHING]: 'Refreshing',
    [STATUS.RUNNING]: 'Running',
    [STATUS.SKIPPED]: 'Skipped',
    [STATUS.STOPPED]: 'Stopped',
    [STATUS.WARNING]: 'Warning'
}

/**
 * Compute an overarching generic status based on a set of statuses.
 *
 * @param components An array of statuses with which to compute the final one.
 */
export function parseStatus (components: Array<Status>): Status {
    // If no components were found, or every component is of status 'empty',
    // parent should be marked and 'empty', too.
    if (!components.length || components.every(component => component === STATUS.EMPTY)) {
        return STATUS.EMPTY
    }

    // Exclude stray empty status before parsing all parts (e.g. all idle parts
    // with the occasional empty part should result in idle status, not partial).
    // We assume, therefore, than an empty part has no effect on the total
    // result. This goes against assuming empty parts should trigger a warning.
    components = components.filter(component => component !== STATUS.EMPTY)

    components = uniq(components)
    if (components.length === 1) {
        return components[0]
    }

    // If there are mixed queued and non-queued components, we'll consider the
    // final status as running, assuming this is transient because the status
    // will update again until queued components are run or process is stopped,
    // in which case we'll manually change from running to something else.
    if (components.includes(STATUS.QUEUED)) {
        return STATUS.RUNNING
    }

    if (components.includes(STATUS.ERROR)) {
        return STATUS.ERROR
    }

    if (components.includes(STATUS.FAILED)) {
        return STATUS.FAILED
    }

    if (components.includes(STATUS.WARNING)) {
        return STATUS.WARNING
    }

    if (components.includes(STATUS.INCOMPLETE)) {
        return STATUS.INCOMPLETE
    }

    // If components include a skipped test, we'll consider its parent as
    // incomplete. It's not obviously skipped, as something inside might've
    // been run. Marking it as partial, on the other hand, could be confusing,
    // as it's something we use for things that have run partially, i.e. not
    // activated by the user itself rather than activated and skipped by the
    // framework itself. Not 100% sure this is the right way to go, so we can
    // revisit this in the future with more experience and feedback.
    if (components.includes(STATUS.SKIPPED)) {
        return STATUS.INCOMPLETE
    }

    return STATUS.PARTIAL
}

/**
 * Compute an overarching framework status based on a set of statuses. This
 * differs slightly from @parseStatus only because frameworks support a few
 * additional statuses.
 *
 * @param components An array of statuses with which to compute the final one.
 */
export function parseFrameworkStatus (components: Array<FrameworkStatus>): FrameworkStatus {
    if (!components.length || components.every(component => component === STATUS.EMPTY)) {
        return STATUS.EMPTY
    }

    components = uniq(components)
    if (components.length === 1) {
        return components[0]
    }

    if (components.includes(STATUS.LOADING)) {
        return STATUS.LOADING
    }

    if (components.includes(STATUS.RUNNING)) {
        return STATUS.RUNNING
    }

    if (components.includes(STATUS.REFRESHING)) {
        return STATUS.REFRESHING
    }

    return parseStatus(components as Array<Status>)
}
