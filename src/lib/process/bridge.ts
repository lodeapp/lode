import { v4 as uuid } from 'uuid'
import { app, ipcRenderer } from 'electron'
import { ProcessId, ProcessOptions } from './process'
import { ProcessFactory } from './factory'
import { ProcessListener } from './listener'
import pool from '@lib/process/pool'

/**
 * A bridge for running processes, optionally between
 * Electron's renderer and main processes.
 */
export class ProcessBridge {

    // public static make (options: ProcessOptions): Promise<number> {
    public static make (options: ProcessOptions) {
        // Are we in the main process? If so, defer to factory.
        if (typeof app !== 'undefined') {
            return ProcessFactory.make(options)
        }

        const id = uuid()
        ipcRenderer.send('spawn', id, options)
        return new ProcessListener(id)
    }

    public static stop (id: ProcessId): Promise<void> {
        return new Promise((resolve, reject) => {
            if (typeof app !== 'undefined') {
                const running = pool.findProcess(id)
                if (!running) {
                    resolve()
                    return
                }

                running!
                    .on('killed', () => {
                        resolve()
                    })
                    .stop()
            }

            ipcRenderer
                .on(`${id}:stopped`, () => {
                    resolve()
                })
                .send('stop', id)
        })
    }
}
