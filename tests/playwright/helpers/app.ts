import type { Page } from '@playwright/test'
import * as path from 'node:path'
import { loadFixture } from './fixtures'
import { ipcEvent } from './ipc'

const INIT_BUNDLE = path.resolve(__dirname, '../.init-bundle.js')

interface StartOptions {
    theme?: string
    version?: string
    focus?: boolean
    projectId?: string
    [key: string]: any
}

/**
 * Navigate to the app and trigger the initial IPC sequence.
 */
export async function start(page: Page, options: StartOptions = {}): Promise<void> {
    await page.addInitScript({ path: INIT_BUNDLE })
    await page.goto('/')

    const mergedOptions = {
        theme: 'light',
        version: '0.0.0',
        focus: true,
        ...options,
    }

    await ipcEvent(page, 'did-finish-load', mergedOptions)
    await nextTick(page)
}

/**
 * Start the app and load a project.
 */
export async function startWithProject(page: Page, options: StartOptions = {}): Promise<void> {
    await start(page, options)
    const project = loadFixture('framework/project.json')
    await ipcEvent(page, 'project-ready', project)
    await page.waitForTimeout(1)
}

/**
 * Start the app in snapshot (read-only) mode and load a project.
 */
export async function startWithSnapshot(page: Page, options: StartOptions = {}): Promise<void> {
    await start(page, {
        ...options,
        snapshotMode: true,
        snapshotMetadata: loadFixture('snapshot/metadata.json'),
        snapshotFilePath: '/path/to/results.lode',
    })
    const project = loadFixture('snapshot/project.json')
    await ipcEvent(page, 'project-ready', project)
    await page.waitForTimeout(1)
}

/**
 * Wait for Vue reactivity to settle.
 */
export async function nextTick(page: Page): Promise<void> {
    await page.waitForTimeout(1)
}
