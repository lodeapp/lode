import { find } from 'lodash'
import { Jest } from './jest/framework'
import { PHPUnit } from './phpunit/framework'

export { Jest }
export { PHPUnit }

export const Frameworks = [Jest, PHPUnit]

/**
 * Get a framework class by its type.
 *
 * @param type The slug representing the framework type.
 */
export function getFrameworkByType (type: string): typeof Jest | typeof PHPUnit | undefined {
    return find(Frameworks, framework => framework.getDefaults().type === type)
}
