import { clipboard, shell } from 'electron'
import { Ipc } from './ipc'

export const Lode = {
    ipc: new Ipc(),

    copyToClipboard (string: string): void {
        clipboard.writeText(string)
    },

    openExternal (link: string): void {
        shell.openExternal(link)
    }
}
