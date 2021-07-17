import { ipcRenderer } from 'electron'

export enum AllowedIpcEventMap {
  'framework-add',
  'framework-filter',
  'framework-refresh',
  'framework-remove',
  'framework-reset-filters',
  'framework-select',
  'framework-start',
  'framework-stop',
  'framework-suites',
  'framework-toggle-child',
  'framework-update',
  'log',
  'maximize',
  'menu-refresh',
  'nugget-context-menu',
  'project-active-framework',
  'project-repositories',
  'project-switch',
  'repository-remove',
  'repository-toggle',
  'select-all',
  'settings-reset',
  'settings-update',
  'track-event',
  'track-screenview'
}

export enum AllowedIpcInvocationMap {
    'file-context-menu',
    'framework-autoload-path-menu',
    'framework-context-menu',
    'framework-get',
    'framework-get-ledger',
    'framework-identity-menu',
    'framework-tests-path-menu',
    'framework-types',
    'framework-validate',
    'licenses',
    'log-project',
    'log-settings',
    'project-add-repositories-menu',
    'project-context-menu',
    'project-empty-repositories',
    'project-remove',
    'project-update',
    'repository-add',
    'repository-context-menu',
    'repository-exists',
    'repository-frameworks',
    'repository-locate',
    'repository-scan',
    'repository-validate',
    'terms',
    'test-get',
    'titlebar-menu'
}

export type AllowedIpcEvents = keyof typeof AllowedIpcEventMap
export type AllowedIpcInvocations = keyof typeof AllowedIpcInvocationMap

export class Ipc {
    public send: any
    public invoke: any
    public on: Function
    public once: Function
    public removeAllListeners: Function

    constructor () {
        this.send = this.handleSend.bind(this)
        this.invoke = this.handleInvoke.bind(this)
        this.on = this.handleOn.bind(this)
        this.once = this.handleOnce.bind(this)
        this.removeAllListeners = this.handleRemoveAllListeners.bind(this)
    }

    handleSend (channel: AllowedIpcEvents, ...args: any[]): void {
        if (typeof AllowedIpcEventMap[channel] === 'undefined') {
            log.error(`Unexpected event sent from renderer: ${channel}`)
            return
        }
        return ipcRenderer.send(channel, ...args)
    }

    handleInvoke (channel: AllowedIpcInvocations, ...args: any[]): Promise<any> {
        if (typeof AllowedIpcInvocationMap[channel] === 'undefined') {
            log.error(`Unexpected invocation attempted on renderer: ${channel}`)
            return Promise.reject()
        }
        return ipcRenderer.invoke(channel, ...args)
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
