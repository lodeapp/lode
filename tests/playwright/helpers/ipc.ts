import type { Page } from '@playwright/test'

/**
 * Trigger an IPC event from the "main process" (simulated).
 * Calls electron.ipcRenderer.trigger() in the browser context.
 */
export async function ipcEvent(page: Page, ...args: any[]): Promise<void> {
    await page.evaluate((eventArgs) => {
        const electron = (window as any).electron
        electron.ipcRenderer.trigger(...eventArgs)
    }, args)
}

/**
 * Reset the call history for both send and invoke spies.
 */
export async function ipcResetMockHistory(page: Page): Promise<void> {
    await page.evaluate(() => {
        ;(window as any).electron.ipcRenderer.resetHistory()
    })
}

/**
 * Get a specific invoke call by index.
 */
export async function getInvokeCall(page: Page, index: number): Promise<{ args: any[] }> {
    return page.evaluate((i) => {
        return (window as any).electron.ipcRenderer._invokeCalls[i]
    }, index)
}

/**
 * Get a specific send call by index.
 */
export async function getSendCall(page: Page, index: number): Promise<{ args: any[] }> {
    return page.evaluate((i) => {
        return (window as any).electron.ipcRenderer._sendCalls[i]
    }, index)
}

/**
 * Set the invoke handler (replaces cy.stub(ipcRenderer, 'invoke', fn)).
 * Injects fixture data into window.__fixtures__ and sets the invoke handler
 * as a function constructed from the handler body string.
 *
 * The handlerBody receives `method` and `...args` parameters and can
 * reference `window.__fixtures__` for fixture data.
 */
export async function setInvokeHandler(
    page: Page,
    data: Record<string, any>,
    handlerBody: string,
): Promise<void> {
    await page.evaluate(({ data, body }) => {
        ;(window as any).__fixtures__ = data
        ;(window as any).electron.ipcRenderer._invokeHandler
            = new Function('method', '...args', body) as (channel: string, ...args: any[]) => any
    }, { data, body: handlerBody })
}

/**
 * Clear the invoke handler (restore default behavior).
 */
export async function clearInvokeHandler(page: Page): Promise<void> {
    await page.evaluate(() => {
        ;(window as any).electron.ipcRenderer._invokeHandler = null
    })
}
