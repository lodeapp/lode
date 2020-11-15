import { ipcRenderer } from 'electron'

// @TODO: Add `payload` method and replace Vue.mixin
// @TODO: Restrict send and invoke to available calls
export class Ipc {
    public send: any
    public invoke: any
    public on: Function
    public once: Function
    public removeAllListeners: Function

    constructor () {
        this.send = ipcRenderer.send
        this.invoke = ipcRenderer.invoke
        this.on = this.handleOn.bind(this)
        this.once = this.handleOnce.bind(this)
        this.removeAllListeners = this.handleRemoveAllListeners.bind(this)
    }

    handleOn (channel: string, listener: (event: Electron.IpcRendererEvent, ...args: any[]) => void): this {
        ipcRenderer.on(channel, listener)
        return this
    }

    handleOnce (channel: string, listener: (event: Electron.IpcRendererEvent, ...args: any[]) => void): this {
        ipcRenderer.once(channel, listener)
        return this
    }

    handleRemoveAllListeners (channel: string): this {
        ipcRenderer.removeAllListeners(channel)
        return this
    }
}
