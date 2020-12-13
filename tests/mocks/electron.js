const electron = {
    ipcRenderer: {
        listeners: {},
        on (event, callback) {
            electron.ipcRenderer.listeners[event] = callback
        }
    }
}

module.exports = electron
