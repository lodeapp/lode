/**
 * This file is bundled by global-setup.ts (via esbuild) into .init-bundle.js
 * and injected into the browser via page.addInitScript({ path }).
 *
 * It sets up window.Lode, window.electron, and window.log before the app mounts.
 * The `electron` import resolves to tests/mocks/electron.js via esbuild alias.
 */
import { Lode } from '../../src/preload/lode'
import electron from '../mocks/electron'

// Extend ipcRenderer with call tracking and invoke handler support
const ipcRenderer = electron.ipcRenderer as any

ipcRenderer._sendCalls = [] as Array<{ args: any[] }>
ipcRenderer._invokeCalls = [] as Array<{ args: any[] }>
ipcRenderer._invokeHandler = null as ((channel: string, ...args: any[]) => any) | null

// Wrap send to track calls
const _originalSend = ipcRenderer.send.bind(ipcRenderer)
ipcRenderer.send = function (channel: string, ...args: any[]) {
    ipcRenderer._sendCalls.push({ args: [channel, ...args] })
    return _originalSend(channel, ...args)
}

// Wrap invoke to track calls and support a custom handler
const _originalInvoke = ipcRenderer.invoke.bind(ipcRenderer)
ipcRenderer.invoke = function (channel: string, ...args: any[]) {
    ipcRenderer._invokeCalls.push({ args: [channel, ...args] })
    if (ipcRenderer._invokeHandler) {
        return Promise.resolve(ipcRenderer._invokeHandler(channel, ...args))
    }
    return _originalInvoke(channel, ...args)
}

// Helper to reset tracking arrays
ipcRenderer.resetHistory = function () {
    ipcRenderer._sendCalls = []
    ipcRenderer._invokeCalls = []
}

// Set globals
;(window as any).Lode = Lode
;(window as any).electron = electron

// Stub the global logger (mirrors tests/mocks/setup.js)
;(window as any).log = {
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
}
