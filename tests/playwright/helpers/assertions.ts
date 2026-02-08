import type { Locator, Page } from '@playwright/test'
import { expect } from '@playwright/test'

/**
 * Assert that ipcRenderer.invoke was called with the given arguments.
 * Uses expect.poll for auto-retry.
 */
export async function assertInvoked(page: Page, ...args: any[]): Promise<void> {
    await expect.poll(async () => {
        const calls: Array<{ args: any[] }> = await page.evaluate(() =>
            (window as any).electron.ipcRenderer._invokeCalls,
        )
        return calls.some(call =>
            JSON.stringify(call.args) === JSON.stringify(args),
        )
    }, { message: `Expected invoke to be called with ${JSON.stringify(args)}`, timeout: 5000 }).toBe(true)
}

/**
 * Assert that ipcRenderer.invoke was called exactly once with the given arguments.
 */
export async function assertInvokedOnce(page: Page, ...args: any[]): Promise<void> {
    await expect.poll(async () => {
        const calls: Array<{ args: any[] }> = await page.evaluate(() =>
            (window as any).electron.ipcRenderer._invokeCalls,
        )
        return calls.filter(call =>
            JSON.stringify(call.args) === JSON.stringify(args),
        ).length
    }, { message: `Expected invoke to be called exactly once with ${JSON.stringify(args)}`, timeout: 5000 }).toBe(1)
}

/**
 * Assert the total number of invoke calls.
 */
export async function assertInvokedCount(page: Page, times: number): Promise<void> {
    await expect.poll(async () => {
        return page.evaluate(() =>
            (window as any).electron.ipcRenderer._invokeCalls.length,
        )
    }, { message: `Expected invoke call count to be ${times}`, timeout: 5000 }).toBe(times)
}

/**
 * Assert that ipcRenderer.send was called with the given arguments.
 * Uses expect.poll for auto-retry.
 */
export async function assertEmitted(page: Page, ...args: any[]): Promise<void> {
    await expect.poll(async () => {
        const calls: Array<{ args: any[] }> = await page.evaluate(() =>
            (window as any).electron.ipcRenderer._sendCalls,
        )
        return calls.some(call =>
            JSON.stringify(call.args) === JSON.stringify(args),
        )
    }, { message: `Expected send to be called with ${JSON.stringify(args)}`, timeout: 5000 }).toBe(true)
}

/**
 * Assert that ipcRenderer.send was called exactly once with the given arguments.
 */
export async function assertEmittedOnce(page: Page, ...args: any[]): Promise<void> {
    await expect.poll(async () => {
        const calls: Array<{ args: any[] }> = await page.evaluate(() =>
            (window as any).electron.ipcRenderer._sendCalls,
        )
        return calls.filter(call =>
            JSON.stringify(call.args) === JSON.stringify(args),
        ).length
    }, { message: `Expected send to be called exactly once with ${JSON.stringify(args)}`, timeout: 5000 }).toBe(1)
}

/**
 * Assert the total number of send calls.
 */
export async function assertEmittedCount(page: Page, times: number): Promise<void> {
    await expect.poll(async () => {
        return page.evaluate(() =>
            (window as any).electron.ipcRenderer._sendCalls.length,
        )
    }, { message: `Expected send call count to be ${times}`, timeout: 5000 }).toBe(times)
}

/**
 * Assert the channel (first arg) of a specific invoke call.
 * Uses polling to wait for the call to appear.
 */
export async function assertInvokeCallChannel(page: Page, index: number, channel: string): Promise<void> {
    await expect.poll(async () => {
        const call = await page.evaluate(i =>
            (window as any).electron.ipcRenderer._invokeCalls[i], index)
        return call?.args?.[0]
    }, { message: `Expected invoke call[${index}] channel to be "${channel}"`, timeout: 5000 }).toBe(channel)
}

/**
 * Assert all arguments of a specific invoke call.
 * Uses polling to wait for the call to appear.
 */
export async function assertInvokeCallArgs(page: Page, index: number, ...args: any[]): Promise<void> {
    await expect.poll(async () => {
        const call = await page.evaluate(i =>
            (window as any).electron.ipcRenderer._invokeCalls[i], index)
        return call?.args
    }, { message: `Expected invoke call[${index}] args to be ${JSON.stringify(args)}`, timeout: 5000 }).toEqual(args)
}

/**
 * Assert a specific argument at an index of a specific invoke call.
 * Uses polling to wait for the call to appear.
 */
export async function assertInvokeCallArgEq(page: Page, callIndex: number, argIndex: number, value: any): Promise<void> {
    await expect.poll(async () => {
        const call = await page.evaluate(i =>
            (window as any).electron.ipcRenderer._invokeCalls[i], callIndex)
        return call?.args?.[argIndex]
    }, { message: `Expected invoke call[${callIndex}] arg[${argIndex}] to equal ${JSON.stringify(value)}`, timeout: 5000 }).toEqual(value)
}

/**
 * Assert the channel (first arg) of a specific send call.
 * Uses polling to wait for the call to appear.
 */
export async function assertSendCallChannel(page: Page, index: number, channel: string): Promise<void> {
    await expect.poll(async () => {
        const call = await page.evaluate(i =>
            (window as any).electron.ipcRenderer._sendCalls[i], index)
        return call?.args?.[0]
    }, { message: `Expected send call[${index}] channel to be "${channel}"`, timeout: 5000 }).toBe(channel)
}

/**
 * Assert all arguments of a specific send call.
 * Uses polling to wait for the call to appear.
 */
export async function assertSendCallArgs(page: Page, index: number, ...args: any[]): Promise<void> {
    await expect.poll(async () => {
        const call = await page.evaluate(i =>
            (window as any).electron.ipcRenderer._sendCalls[i], index)
        return call?.args
    }, { message: `Expected send call[${index}] args to be ${JSON.stringify(args)}`, timeout: 5000 }).toEqual(args)
}

/**
 * Assert normalized (trimmed) innerText of a locator.
 * Supports multiline text with \n separators.
 */
export async function assertNormalizedText(locator: Locator, expected: string): Promise<void> {
    await expect(locator).toHaveText(expected, { useInnerText: true })
}
