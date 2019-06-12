import { remote } from 'electron'
import { track } from './index'
import { appName } from './format'

const g = global as any

g.track = {
    screenview(screen: string) {
        track.screenview(screen, appName(), remote.app.getVersion())
    },
    event (
        category: string,
        action: string,
        label: string | null = null,
        value: string | null = null
    ): void {
        track.event(category, action, label, value)
    }
} as ITracker
