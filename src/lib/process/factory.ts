import { find } from 'lodash'
import { ProcessId, ProcessOptions, IProcess, DefaultProcess } from './process'
import { Runners } from './runners'
import pool from './pool'

export class ProcessFactory {

    public static make (options: ProcessOptions, id?: ProcessId): IProcess {

        let spawned: IProcess | null = null

        if (options.forceRunner) {
            // If a runner has been pre-determined, try to find it within list of
            // existing runners and create a process with it, if possible.
            const runner = find(Runners, runner => runner.type === options.forceRunner)
            if (runner) {
                spawned = new runner(options)
            }
        } else {
            // If no runner was specificed, we'll try to determine which runner to
            // use by feeding each of them the command.
            for (let i = 0; i < Runners.length; i++) {
                if (Runners[i].owns(options.command)) {
                    spawned = new Runners[i](options)
                }
            }
        }

        spawned = spawned || new DefaultProcess(options)

        pool.add(spawned, id)

        return spawned
    }
}
