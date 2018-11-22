import { IProcess, DefaultProcess } from './process'
import { YarnProcess } from './runners'
import pool from './pool'

export type ProcessOptions = {
    command: string
    args: Array<string>
    path: string
    runner?: string | null
}

export class ProcessFactory {

    // @TODO: enforce ProcessOptions for instantiation
    public static make (
        command: string,
        args: Array<string>,
        path: string,
        runner?: string | null
    ): IProcess {

        let spawned: IProcess | null

        switch (runner) {
            case 'yarn':
                spawned = new YarnProcess(command, args, path)
                break

            default:
                spawned = new DefaultProcess(command, args, path)
        }

        pool.add(spawned)

        return spawned
    }
}
