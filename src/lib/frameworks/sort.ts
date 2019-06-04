import { get } from 'lodash'

/**
 * The sort direction possibilities.
 */
type SortDirection = 'asc' | 'desc'

/**
 * A list of possible framework sort options.
 */
export type FrameworkSort = 'framework' | 'name' | 'updated' | 'run' | 'duration' | 'maxduration'

export const sortOptions: { [key in FrameworkSort]: string } = {
    framework: 'Running order',
    name: 'Name',
    updated: 'Date last updated',
    run: 'Date last run',
    duration: 'Slowest',
    maxduration: 'Slowest test presence'
}

export const sortDirections: { [key in FrameworkSort]: SortDirection } = {
    framework: 'asc',
    name: 'asc',
    updated: 'desc',
    run: 'desc',
    duration: 'desc',
    maxduration: 'desc'
}

/**
 * Map a sort option to its display name.
 *
 * @param sort The sort option to map to a display name.
 */
export function sortDisplayName (sort: FrameworkSort): string {
    return get(sortOptions, sort, 'Unknown sort')
}

/**
 * Return the reverse of a given direction.
 *
 * @param direction The direction to return the reverse of.
 */
export function reverseDirection (direction: SortDirection): SortDirection {
    return direction === 'asc' ? 'desc' : 'asc'
}

/**
 * Map a sort option to its default direction.
 *
 * @param sort The sort option to map to a direction.
 * @param reverse Whether to reverse the default direction.
 */
export function sortDirection (sort: FrameworkSort, reverse: boolean): SortDirection {
    const direction = get(sortDirections, sort, 'asc')
    return reverse ? reverseDirection(direction) : direction
}
