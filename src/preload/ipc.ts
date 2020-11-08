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

    handleOn (event: string, listener: (event: Electron.IpcRendererEvent, ...args: any[]) => void): this {
        console.log('REGISTERING LISTENER', event, listener)
        ipcRenderer.on(event, listener)
        return this
    }

    handleOnce (event: string, listener: (event: Electron.IpcRendererEvent, ...args: any[]) => void): this {
        ipcRenderer.once(event, listener)
        return this
    }

    handleRemoveAllListeners (event: string): this {
        console.log('REMOVING LISTENER', event)
        ipcRenderer.removeAllListeners(event)
        return this
    }
}
