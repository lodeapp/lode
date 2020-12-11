import '@lib/logger/preload'

import { clipboard, contextBridge, shell } from 'electron'
import { Ipc } from './ipc'

contextBridge.exposeInMainWorld('Lode', {
    ipc: new Ipc(),

    copyToClipboard (string: string) {
        clipboard.writeText(string)
    },

    openExternal (link: string) {
        shell.openExternal(link)
    }
})
