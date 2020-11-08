const g = global as any

g.track = {
    screenview (screen: string) {
        Lode.ipc.send('track-screenview', screen)
    },
    event (category: string, action: string, label: string | null = null, value: string | null = null): void {
        Lode.ipc.send('track-event', category, action, label, value)
    }
} as ITracker
