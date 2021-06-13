import { find } from 'lodash'
import { ProcessId, ProcessOptions, IProcess, DefaultProcess } from '@lib/process/process'
import { Runners } from '@lib/process/runners'
import pool from '@lib/process/pool'

export class ProcessFactory {
    /**
     * Make a new process according to the given options.
     *
     * @param options The options for the process we're making.
     * @param poolId An optional id with which the newly made process will be added to the pool.
     */
    public static make (options: ProcessOptions, poolId?: ProcessId): IProcess {
        let spawned: IProcess | null = null

        if (options.forceRunner) {
            // If a runner has been pre-determined, try to find it within list of
            // existing runners and create a process with it, if possible.
            const Runner = find(Runners, runner => runner.type === options.forceRunner)
            if (Runner) {
                spawned = new Runner(options)
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

        pool.add(spawned, poolId)

        return spawned
    }
}
