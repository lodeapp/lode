import { EventEmitter } from 'events'
import { ApplicationWindow } from '@main/application-window'

/**
 * A special event emitter that can also emit events
 * to the renderer process from a given window.
 */
export class ProjectEventEmitter extends EventEmitter {
    protected window: ApplicationWindow

    constructor (window: ApplicationWindow) {
        super()
        this.window = window
    }

    /**
     * Emit an event to the renderer process.
     */
    protected emitToRenderer (event: string, ...args: any[]): void {
        if (this.window.canReceiveEvents()) {
            this.window.send(event, args)
        }
    }

    /**
     * Get the emitter's application window.
     */
    public getApplicationWindow (): ApplicationWindow {
        return this.window
    }
}
