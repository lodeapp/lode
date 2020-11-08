import { clipboard, contextBridge, shell } from 'electron'
import { Ipc } from './ipc'

contextBridge.exposeInMainWorld('Lode', {
    ipc: new Ipc(),
    // @TODO: Restrict clipboard to required methods
    clipboard,
    // @TODO: Restrict shell to required methods
    shell
})
