import { ApplicationWindow } from '@main/application-window'
import { FrameworkOptions, IFramework } from './framework'
import { getFrameworkByType } from '@lib/frameworks'

export class FrameworkFactory {
    /**
     * Make a new framework instance.
     *
     * @param window The application window which will own the framework
     * @param options The options to make the framework with
     */
    public static make (
        window: ApplicationWindow,
        options: FrameworkOptions
    ): IFramework {
        const Framework = getFrameworkByType(options.type)

        if (Framework) {
            // Create a new framework with hydrated options, in case defaults
            // ever change significantly from any persisted state.
            return new Framework(window, Framework.hydrate(options))
        }

        throw new Error(`Unknown framework type "${options.type}"`)
    }
}
