const electron = {
    ipcRenderer: {
        listeners: {
            on: {},
            once: {}
        },
        on (event, callback) {
            electron.ipcRenderer.listeners.on[event] = callback
        },
        once (event, callback) {
            electron.ipcRenderer.listeners.once[event] = callback
        },
        send (channel, ...args) {},
        invoke (channel, ...args) {},
        removeAllListeners (channel) {},

        /**
         * Mimick a channel event coming from the main process.
         *
         * @param channel The channel in which the event is being triggered
         * @param args The arguments with which the event is being triggered
         */
        trigger (channel, ...args) {
            const event = {}
            electron.ipcRenderer.listeners.on[channel](event, ...args)
            if (typeof electron.ipcRenderer.listeners.once[channel] !== 'undefined') {
                electron.ipcRenderer.listeners.once[channel](event, ...args)
                delete electron.ipcRenderer.listeners.once[channel]
            }
        }
    }
}

module.exports = electron
