import { EventEmitter } from 'events'
import { ipcRenderer } from 'electron'
import { ProcessId, IProcess } from './process'

/**
 * An implementation of the Process interface that's merely a listener
 * for framework processes running in Electron's main process.
 */
export class ProcessListener extends EventEmitter implements IProcess {

    protected readonly id: ProcessId

    constructor (id: ProcessId) {
        super()
        this.id = id
    }

    /**
     * Get this process's unique id.
     */
    public getId (): ProcessId {
        return this.id
    }

    /**
     * Override default listener registration, as we won't actually emit
     * any events from this class. Instead, we'll trigger the given callback
     * callback when the requested IPC renderer event is fired.
     */
    public on (eventType: string, callback: Function): this {
        ipcRenderer.on(`${this.id}:${eventType}`, (event: Electron.IpcRendererEvent, ...args: any) => {
            callback(...args)
        })
        return this
    }

    /**
     * Kill this process.
     */
    public stop (): void {
        throw Error('Cannot stop a listener-type process directly. Use the process bridge.')
    }

    /**
     * Whether this process owns a given command. A Listener-type process
     * will never own a given command because it's just acting as a bridge
     * and should not be queried for ownership.
     *
     * @param command The command we're checking to match the runner.
     */
    public owns (command: string): boolean {
        throw Error('Cannot determine ownership of a command from a listener-type process directly. Use the process bridge.')
    }
}
