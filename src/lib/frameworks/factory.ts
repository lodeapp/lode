import { ApplicationWindow } from '@main/application-window'
import { FrameworkOptions, IFramework } from './framework'
import { getFrameworkByType } from '@lib/frameworks'

export class FrameworkFactory {

    public static make (
        window: ApplicationWindow,
        options: FrameworkOptions
    ): IFramework {

        const framework = getFrameworkByType(options.type)

        if (framework) {
            // Create a new framework with hydrated options, in case defaults
            // ever change significantly from any persisted state.
            return new framework(window, framework.hydrate(options))
        }

        throw new Error(`Unknown framework type "${options.type}"`)
    }
}
