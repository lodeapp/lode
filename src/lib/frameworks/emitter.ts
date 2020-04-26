import { EventEmitter } from 'events'

/**
 * A special event emitter that also emits project events
 * that will be sent over to the appropriate renderer instance.
 */
export abstract class ProjectEventEmitter extends EventEmitter {

    constructor () {
        super()
    }

    /**
     * Get the model's id.
     */
    public abstract getId (): string

    /**
     * The event emitter. It overrides Node's emitter to emit a
     * project event in addition to the event itself, which will
     * eventually get sent via a model-specific channel.
     */
    public emit (event: string | symbol, ...args: any[]): boolean {
        // Emit project event before deferring back to parent implementation.
        super.emit('project-event', {
            id: this.getId(),
            event,
            args
        })
        return super.emit(event, ...args)
    }

    /**
     * A function to run when project events are triggered.
     */
    protected projectEventListener (...args: any[]): void {
        // Cascade the event further up the chain. Once it's emitted,
        // restore propagation.
        super.emit('project-event', ...args)
    }
}
