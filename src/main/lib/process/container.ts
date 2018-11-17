import { IProcess } from './process'

class ProcessContainer {
    public readonly processes: { [index: number]: IProcess } = {}

    public add (process: IProcess): void {
        const id = process.getId()
        if (!id) {
            return
        }

        this.processes[id] = process

        process.on('close', () => {
            if (typeof this.processes[id] !== 'undefined') {
                delete this.processes[id]
            }
        })
    }

    public findProcess(id: number): IProcess | undefined {
        return this.processes[id]
    }
}

const container = new ProcessContainer()

export default container
