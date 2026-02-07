import { defineStore } from 'pinia'

export const useAlertStore = defineStore('alert', {
    state: () => ({
        alerts: [],
    }),
    actions: {
        show(alert, modalPlugin) {
            this.alerts.push(alert)
            if (this.alerts.length === 1) {
                modalPlugin.open('AlertStack', {}, () => {
                    this.clear()
                })
            }
        },
        hide() {
            this.alerts.pop()
        },
        clear() {
            this.alerts = []
        },
    },
})
