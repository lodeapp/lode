import { expect, test } from '@playwright/test'
import { nextTick, startWithProject } from '../helpers/app'
import {
    assertEmitted,
    assertEmittedOnce,
    assertInvokeCallArgs,
    assertInvokeCallChannel,
    assertInvokedCount,
    assertInvokedOnce,
    assertNormalizedText,
} from '../helpers/assertions'
import { loadFixture } from '../helpers/fixtures'
import {
    getInvokeCall,
    ipcEvent,
    ipcResetMockHistory,
    setInvokeHandler,
} from '../helpers/ipc'

test.describe('Repository management', () => {
    let repositories: any[]
    let anotherRepository: any
    let frameworkTypes: any

    test.beforeEach(async () => {
        const allRepos = loadFixture<any[]>('framework/repositories.json')
        // Artificially constrain the repositories array with two,
        // leaving the third one for us to use when needed.
        anotherRepository = allRepos.pop()
        repositories = allRepos
        frameworkTypes = loadFixture('framework/types.json')
    })

    test('manages existing repositories', async ({ page }) => {
        await startWithProject(page)

        await nextTick(page)
        await setInvokeHandler(page, { repositories, frameworkTypes }, `
            const f = window.__fixtures__
            switch (method) {
                case 'repository-frameworks': return []
                case 'project-empty-repositories': return f.repositories
                case 'repository-exists': return true
                case 'framework-types': return Promise.resolve(f.frameworkTypes)
            }
        `)

        await ipcEvent(page, '42:repositories', repositories)
        await nextTick(page)
        await assertInvokedOnce(page, 'repository-frameworks', 'repository-1')
        await ipcResetMockHistory(page)

        const main = page.locator('.contents > main')
        await expect(main).not.toHaveClass(/no-projects/)
        await expect(main).toHaveClass(/project/)

        await expect(page.locator('.split')).toHaveClass(/empty/)
        await expect(page.locator('.sidebar header .sidebar-header').first()).toHaveText('Project')

        const firstItem = page.locator('.sidebar section.scrollable .sidebar-item').first()
        await expect(firstItem).toHaveClass(/status--idle/)
        await expect(firstItem).toHaveClass(/is-expanded/)
        await expect(firstItem.locator('.name')).toContainText('hobnobs')

        const lastItem = page.locator('.sidebar section.scrollable .sidebar-item').last()
        await expect(lastItem).toHaveClass(/status--idle/)
        await expect(lastItem).not.toHaveClass(/is-expanded/)
        await expect(lastItem.locator('.name')).toContainText('digestives')

        // Toggle repository expansion from a couple of
        // different elements.
        await lastItem.locator('.name').click()
        await nextTick(page)
        await assertEmittedOnce(page, 'repository-toggle', 'repository-2', true)
        await assertInvokedOnce(page, 'repository-frameworks', 'repository-2')

        await expect(lastItem).toHaveClass(/is-expanded/)
        await lastItem.click()
        await assertEmitted(page, 'repository-toggle', 'repository-2', false)
        await assertInvokedCount(page, 1)
        await ipcResetMockHistory(page)

        await expect(lastItem).not.toHaveClass(/is-expanded/)

        await expect(page.locator('#list')).toHaveClass(/pane/)
        await expect(page.locator('#list h2')).toHaveText('Scan for frameworks inside your repositories')

        const scanBtn = page.locator('#list .cta .btn-primary')
        await expect(scanBtn).toHaveText('Scan for frameworks')
        await scanBtn.click()

        await assertInvokeCallChannel(page, 0, 'project-empty-repositories')
        await assertInvokeCallArgs(page, 1, 'repository-exists', 'repository-1')
        await assertInvokeCallChannel(page, 2, 'framework-types')
        await assertInvokeCallArgs(page, 3, 'repository-frameworks', 'repository-1')
        await assertInvokeCallChannel(page, 4, 'repository-scan')
        await ipcResetMockHistory(page)

        await expect(page.locator('.modal-header')).toHaveText('Manage test frameworks')
        await expect(page.locator('.modal .repository-settings .repository-name')).toContainText('hobnobs')
        await expect(page.locator('.modal .repository-settings .counters')).toContainText('No frameworks')
        await expect(page.locator('.modal-footer .btn-primary')).toContainText('Save changes')

        const cancelBtn = page.locator('.modal-footer .btn').first()
        await expect(cancelBtn).toContainText('Cancel')
        await cancelBtn.click()

        // After cancelling the previous scan, it should trigger
        // another set of invocations for the second repository.
        await assertInvokeCallArgs(page, 0, 'repository-exists', 'repository-2')
        await assertInvokeCallChannel(page, 1, 'framework-types')
        await assertInvokeCallArgs(page, 2, 'repository-frameworks', 'repository-2')
        await assertInvokeCallChannel(page, 3, 'repository-scan')
        await ipcResetMockHistory(page)

        await expect(page.locator('.modal .repository-settings .repository-name')).toContainText('digestives')
        await expect(page.locator('.modal .repository-settings .counters')).toContainText('No frameworks')

        const scanInModalBtn = page.locator('.modal .repository-settings .btn')
        await expect(scanInModalBtn).toContainText('Scan')
        await scanInModalBtn.click()

        const firstCall = await getInvokeCall(page, 0)
        expect(firstCall.args[0]).toBe('repository-scan')
        await ipcResetMockHistory(page)

        const saveBtn = page.locator('.modal-footer .btn-primary')
        await expect(saveBtn).toContainText('Save changes')
        await saveBtn.click()

        await nextTick(page)
        await expect(page.locator('.modal-header')).toHaveCount(0)
    })

    test('can add repositories through the sidebar', async ({ page }) => {
        await startWithProject(page)

        await nextTick(page)
        await setInvokeHandler(page, { anotherRepository, frameworkTypes }, `
            const f = window.__fixtures__
            switch (method) {
                case 'repository-frameworks': return []
                case 'repository-validate': return null
                case 'repository-add': return [f.anotherRepository]
                case 'repository-exists': return true
                case 'framework-types': return Promise.resolve(f.frameworkTypes)
            }
        `)

        await ipcEvent(page, '42:repositories', repositories)
        await nextTick(page)
        await assertInvokedOnce(page, 'repository-frameworks', 'repository-1')
        await ipcResetMockHistory(page)

        await expect(page.locator('.sidebar section.scrollable .sidebar-item')).toHaveCount(2)

        await expect(page.locator('.sidebar header .sidebar-header').last()).toContainText('Repositories')

        // Force click because sidebar actions are hidden until hover.
        const sidebarAction = page.locator('.sidebar header .sidebar-action')
        await sidebarAction.click({ force: true })

        await expect(page.locator('.modal-header')).toHaveText('Add repositories to Biscuit')
        await expect(page.locator('.modal-footer .btn-primary')).toContainText('Add repositories')
        await expect(page.locator('.modal-footer .btn-primary')).toBeDisabled()

        const cancelBtn = page.locator('.modal-footer .btn').first()
        await expect(cancelBtn).toContainText('Cancel')
        await cancelBtn.click()

        // Wait for modal to fully close before reopening
        await expect(page.locator('.modal-header')).toHaveCount(0)
        await nextTick(page)
        await sidebarAction.dispatchEvent('click')

        const inputs = page.locator('form.add-repositories input[type="text"]')
        await expect(inputs).toHaveCount(1)
        await inputs.first().fill('rich-tea')

        await page.locator('.add-repositories .add-row').click()
        await expect(page.locator('form.add-repositories input[type="text"]')).toHaveCount(2)

        await page.locator('form.add-repositories .remove-row').last().click()
        await expect(page.locator('form.add-repositories input[type="text"]')).toHaveCount(1)

        const firstInput = page.locator('form.add-repositories input[type="text"]').nth(0)
        await expect(firstInput).toHaveValue('rich-tea')

        // Click the browse button (next sibling of the input)
        await firstInput.locator('+ *').click()
        await assertInvokedOnce(page, 'project-add-repositories-menu')
        await ipcResetMockHistory(page)

        await expect(page.locator('form.add-repositories input[type="text"]')).toHaveCount(1)
        await expect(page.locator('form.add-repositories input[type="text"]').nth(0)).toHaveValue('rich-tea')

        await page.locator('form.add-repositories .remove-row').last().click()
        await expect(page.locator('form.add-repositories input[type="text"]')).toHaveCount(1)
        await expect(page.locator('form.add-repositories input[type="text"]').nth(0)).toHaveValue('')

        await page.locator('form.add-repositories input[type="text"]').nth(0).fill('rich-tea')

        // Add a duplicate row and an empty one before saving, to see if
        // we're correctly disambiguating repository paths.
        await page.locator('.add-repositories .add-row').click()
        await page.locator('.add-repositories .add-row').click()
        await page.locator('form.add-repositories input[type="text"]').nth(1).fill('rich-tea')

        // By default it should add and scan, unless we explicitly
        // disable the auto-scan feature.
        await page.locator('.modal-footer .btn-primary').click()

        await assertInvokeCallArgs(page, 0, 'repository-validate', { path: '' })
        await assertInvokeCallArgs(page, 1, 'repository-validate', { path: 'rich-tea' })
        await assertInvokeCallArgs(page, 2, 'repository-validate', { path: 'rich-tea' })
        // After validating, the only repository to be added is the first unique path.
        await assertInvokeCallArgs(page, 3, 'repository-add', ['rich-tea'])
        await assertInvokeCallArgs(page, 4, 'repository-exists', 'repository-3')
        await assertInvokeCallChannel(page, 5, 'framework-types')
        await assertInvokeCallArgs(page, 6, 'repository-frameworks', 'repository-3')
        await assertInvokeCallChannel(page, 7, 'repository-scan')
        await ipcResetMockHistory(page)

        // Wait for the AddRepositories modal to close, leaving only ManageFrameworks
        await expect(page.locator('.modal-header')).toHaveCount(1)
        await expect(page.locator('.modal-header')).toHaveText('Manage test frameworks')
        await expect(page.locator('.modal .repository-settings .repository-name')).toContainText('rich-tea')
        await expect(page.locator('.modal .repository-settings .counters')).toContainText('No frameworks')

        await page.locator('.modal-footer .btn-primary').click()

        // Simulate project receiving the added repository
        await ipcEvent(page, '42:repositories', [...repositories, anotherRepository])
        await expect(page.locator('.sidebar section.scrollable .sidebar-item')).toHaveCount(3)

        const lastSidebarItem = page.locator('.sidebar section.scrollable .sidebar-item').last()
        await expect(lastSidebarItem).toHaveClass(/status--idle/)
        await expect(lastSidebarItem).not.toHaveClass(/is-expanded/)
        await expect(lastSidebarItem.locator('.name')).toContainText('rich-tea')

        // Wait for the manage frameworks modal to fully close
        await expect(page.locator('.modal-header')).toHaveCount(0)

        // Now we'll add another repository, this time without auto-scan
        await nextTick(page)
        await ipcResetMockHistory(page)
        await sidebarAction.dispatchEvent('click')
        await expect(page.locator('.modal-header')).toHaveText('Add repositories to Biscuit')
        await page.locator('form.add-repositories input[type="text"]').fill('rich-tea')

        await page.locator('.auto-scan input[type="checkbox"]').uncheck()

        // This is a bit flaky in CI, as its seems two modals can
        // occasionally co-exist, so force "last" button, just in case.
        await page.locator('.modal-footer .btn-primary').last().click()

        await assertInvokedCount(page, 2)
        await assertInvokeCallArgs(page, 0, 'repository-validate', { path: 'rich-tea' })
        await assertInvokeCallArgs(page, 1, 'repository-add', ['rich-tea'])
    })

    test('triggers repository context menu', async ({ page }) => {
        await startWithProject(page)

        await nextTick(page)
        await setInvokeHandler(page, {}, 'return Promise.resolve(true)')

        // Collapse all repositories to avoid calling for frameworks.
        const collapsedRepos = repositories.map(r => ({ ...r, expanded: false }))
        await ipcEvent(page, '42:repositories', collapsedRepos)

        const firstName = page.locator('.sidebar section.scrollable .sidebar-item').first().locator('.name')
        await expect(firstName).toContainText('hobnobs')
        await firstName.click({ button: 'right' })
        await assertInvokedOnce(page, 'repository-context-menu', 'repository-1')
        await ipcResetMockHistory(page)

        const lastName = page.locator('.sidebar section.scrollable .sidebar-item').last().locator('.name')
        await expect(lastName).toContainText('digestives')
        await lastName.click({ button: 'right' })
        await assertInvokedOnce(page, 'repository-context-menu', 'repository-2')
    })
})
