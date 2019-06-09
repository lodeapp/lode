import { app } from 'electron'
import { track } from './index'
import { appName } from './format'

const g = global as any

g.track = {
    screenview(screen: string): void {
        track.screenview(screen, appName(), app.getVersion())
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
