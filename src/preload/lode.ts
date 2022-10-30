import { Ipc } from './ipc'

class Preload {
    public readonly ipc: Ipc
    public readonly copyToClipboard: (string: string) => void
    public readonly openExternal: (link: string) => void

    constructor () {
        this.ipc = new Ipc()

        this.copyToClipboard = (string: string): void => {
            this.ipc.send('copy-to-clipboard', string)
        }

        this.openExternal = (link: string): void => {
            this.ipc.send('open-external-link', link)
        }
    }
}

export const Lode = new Preload()
