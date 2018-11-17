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

        let proc: IProcess | null

        switch (runner) {
            case 'yarn':
                proc = new YarnProcess(command, args, path)
                break

            default:
                proc = new DefaultProcess(command, args, path)
        }

        pool.add(proc)

        return proc
    }
}
