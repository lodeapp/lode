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
        invoke (channel, ...args) {}
    }
}

module.exports = electron
