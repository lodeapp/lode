import { EventEmitter } from 'events'
import { compact } from 'lodash'

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
     * Get the model's channel prefixes.
     *
     * If a model's events are to be listened to in multiple places in the
     * renderer, it should emit separate events to each of those places,
     * because with context isolation we cannot remove listeners granularly.
     * e.g. Framework status events should be emitted separately for the
     * framework currently in focus, and for it's sidebar representation.
     */
    public getChannelPrefixes (event: string): Array<string> | null {
        return null
    }

    /**
     * The event emitter. It overrides Node's emitter to emit a
     * project event in addition to the event itself, which will
     * eventually get sent via a model-specific channel.
     */
    public emit (event: string, ...args: any[]): boolean {
        // Emit a project event for each defined channel prefix before deferring
        // back to parent EventEmitter implementation.
        (this.getChannelPrefixes(event) || ['']).forEach(prefix => {
            super.emit('project-event', {
                channel: compact([prefix, this.getId(), event]).join(':'),
                args
            })
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
