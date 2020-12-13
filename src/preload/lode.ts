import { clipboard, shell } from 'electron'
import { Ipc } from './ipc'

export const Lode = {
    ipc: new Ipc(),

    copyToClipboard (string: string) {
        clipboard.writeText(string)
    },

    openExternal (link: string) {
        shell.openExternal(link)
    }
}
