import { ProcessId, IProcess } from '@lib/process/process'

/**
 * A pool of running processes.
 */
class ProcessPool {
    public readonly processes: { [type in ProcessId]: IProcess } = {}

    /**
     * Add a new process to the pool.
     *
     * @param process The process being pooled.
     * @param id An optional id with which process will be added to the pool.
     */
    public add (process: IProcess, id?: ProcessId): void {

        // If id was given, we'll use it, otherwise we'll
        // try to get it from the process itself.
        if (!id) {
            id = process.getId()

            // If we can't acquire the id, don't pool it.
            if (!id) {
                return
            }
        }

        this.processes[id!] = process

        // Once the process closes, remove it from the pool.
        process.on('close', () => {
            this.remove(id!)
        })
    }

    /**
     * Find a pooled and running process using its id.
     *
     * @param id The id of the process trying to be found.
     */
    public findProcess (id: ProcessId): IProcess | undefined {
        return this.processes[id]
    }

    /**
     * Remove a process from the pool by its id.
     */
    public remove (id: ProcessId): void {
        if (typeof this.processes[id] !== 'undefined') {
            delete this.processes[id]
        }
    }

    /**
     * Clear the process pool.
     */
    public clear (): void {
        Object.keys(this.processes).forEach(id => {
            this.remove(id)
        })
    }
}

const pool = new ProcessPool()

export default pool
