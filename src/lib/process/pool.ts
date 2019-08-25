import { ProcessId, IProcess } from './process'

class ProcessPool {
    public readonly processes: { [type in ProcessId]: IProcess } = {}

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

        process.on('close', () => {
            if (typeof this.processes[id!] !== 'undefined') {
                delete this.processes[id!]
            }
        })
    }

    public findProcess(id: number | string): IProcess | undefined {
        return this.processes[id]
    }
}

const pool = new ProcessPool()

export default pool
