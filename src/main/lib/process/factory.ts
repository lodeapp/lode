import { find } from 'lodash'
import { IProcess, DefaultProcess } from './process'
import { Runners } from './runners'
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
        forceRunner?: string | null
    ): IProcess {

        let spawned: IProcess | null = null

        if (forceRunner) {
            // If a runner has been pre-determined, try to find it within list of
            // existing runners and create a process with it, if possible.
            const runner = find(Runners, runner => runner.type === forceRunner)
            if (runner) {
                spawned = new runner(command, args, path)
            }
        } else {
            // If no runner was specificed, we'll try to determine which runner to
            // use by feeding each of them the command.
            for (let i = 0; i < Runners.length; i++) {
                if (Runners[i].owns(command)) {
                    spawned = new Runners[i](command, args, path)
                }
            }
        }

        spawned = spawned || new DefaultProcess(command, args, path)

        pool.add(spawned)

        return spawned
    }
}
