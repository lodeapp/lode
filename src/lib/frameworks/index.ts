import { find } from 'lodash'
import { Jest } from './jest/framework'
import { PHPUnit } from './phpunit/framework'

export { Jest }
export { PHPUnit }

export const Frameworks = [Jest, PHPUnit]

export function getFrameworkByType(type: string): typeof Jest | typeof PHPUnit | undefined
{
    return find(Frameworks, framework => framework.defaults.type === type)
}
