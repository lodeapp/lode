import { find } from 'lodash'
import { FrameworkOptions, IFramework } from './framework'
import { Frameworks } from '@lib/frameworks'

export class FrameworkFactory {

    public static make (
        options: FrameworkOptions
    ): IFramework {

        const framework = find(Frameworks, framework => framework.defaults.type === options.type)

        if (framework) {
            // Create a new framework with hydrated options, in case defaults
            // ever change significantly from any persisted state.
            return new framework(framework.hydrate(options))
        }

        throw new Error(`Unknown framework type "${options.type}"`)
    }
}
