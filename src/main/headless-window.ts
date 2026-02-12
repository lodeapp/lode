import type { ApplicationWindow } from '@main/application-window'

/**
 * A minimal stand-in for ApplicationWindow used by model constructors
 * in headless (CLI) mode. Suppresses all renderer IPC since there is
 * no BrowserWindow or renderer process.
 *
 * Only implements the two methods that ProjectEventEmitter actually
 * calls on the window: canReceiveEvents() and send().
 */
export class HeadlessWindow {
    public canReceiveEvents(): boolean {
        return false
    }

    public send(_event: string, _args: Array<any> = []): void {
        // No-op: headless mode has no renderer to send events to.
    }
}

/**
 * Cast a HeadlessWindow to ApplicationWindow for use with Project constructor.
 * Safe because ProjectEventEmitter only uses canReceiveEvents() and send().
 */
export function asApplicationWindow(headless: HeadlessWindow): ApplicationWindow {
    return headless as unknown as ApplicationWindow
}
