import { get } from 'lodash'

/**
 * The sort direction possibilities.
 */
type SortDirection = 'asc' | 'desc'

/**
 * A list of possible framework sort options.
 */
export type FrameworkSort = 'framework' | 'name'

export const sortOptions: { [key in FrameworkSort]: string } = {
    framework: 'Running order',
    name: 'Name'
}

export const sortDirections: { [key in FrameworkSort]: SortDirection } = {
    framework: 'asc',
    name: 'asc'
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
