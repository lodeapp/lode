import { IProcess, DefaultProcess } from './process'
import { YarnProcess } from './runners'
import container from './container'

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

        let process: IProcess | null

        switch (runner) {
            case 'yarn':
                process = new YarnProcess(command, args, path)
                break

            default:
                process = new DefaultProcess(command, args, path)
        }

        container.add(process)

        return process
    }
}
