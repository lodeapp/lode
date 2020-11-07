import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('Lode', {
    test: () => {
        return 'hey'
    }
})

const _setImmediate = 'hey'
const _clearImmediate = 'ho'

process.once('loaded', () => {
    global.setImmediate = _setImmediate
    global.clearImmediate = _clearImmediate
})
