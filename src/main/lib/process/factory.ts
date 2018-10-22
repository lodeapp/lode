import { IProcess, DefaultProcess } from './process'
import { YarnProcess } from './runners'

export interface IGitSpawnExecutionOptions {
    readonly command: string
    readonly args: Array<string>
    readonly path: string
    readonly runner?: string | null
}

export class ProcessFactory {

    public static make (
        command: string,
        args: Array<string>,
        path: string,
        runner?: string | null
    ): IProcess {

        switch (runner) {
            case 'yarn':
                return new YarnProcess(command, args, path)

            default:
                return new DefaultProcess(command, args, path)
        }

    }
}
