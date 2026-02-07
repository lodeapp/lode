import { test, expect } from '@playwright/test'
import { start } from '../helpers/app'
import { ipcEvent } from '../helpers/ipc'

test.describe('Themes', () => {
    test('can use light theme on load and switch when notified', async ({ page }) => {
        await start(page)

        const html = page.locator('html')
        await expect(html).toHaveAttribute('data-color-mode', 'light')
        await expect(html).toHaveAttribute('data-light-theme', 'light')
        await expect(html).toHaveAttribute('data-dark-theme', 'dark_dimmed')

        await ipcEvent(page, 'theme-updated', 'dark')
        await expect(html).toHaveAttribute('data-color-mode', 'dark')

        await ipcEvent(page, 'theme-updated', 'light')
        await expect(html).toHaveAttribute('data-color-mode', 'light')
    })

    test('can use dark theme on load', async ({ page }) => {
        await start(page, { theme: 'dark' })

        await expect(page.locator('html')).toHaveAttribute('data-color-mode', 'dark')
    })
})
