import { FrameworkOptions, IFramework } from './framework'
import { Jest, PHPUnit } from './index'

export class FrameworkFactory {

    public static make (
        options: FrameworkOptions
    ): IFramework {

        switch (options.type) {
            case 'jest':
                return new Jest(options)

            case 'phpunit':
                return new PHPUnit(options)
        }

        throw new Error(`Unknown framework type "${options.type}"`)
    }
}
