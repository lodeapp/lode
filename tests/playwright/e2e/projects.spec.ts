import { expect, test } from '@playwright/test'
import { nextTick, start, startWithProject } from '../helpers/app'
import { assertEmitted, assertInvokedOnce } from '../helpers/assertions'
import { loadFixture } from '../helpers/fixtures'
import { ipcEvent, ipcResetMockHistory, setInvokeHandler } from '../helpers/ipc'

test.describe('Project management', () => {
    test('can add projects from the welcome screen', async ({ page }) => {
        await start(page)

        await expect(page.locator('body')).toHaveClass(/is-focused/)

        await ipcEvent(page, 'blur')
        await expect(page.locator('body')).not.toHaveClass(/is-focused/)

        await ipcEvent(page, 'focus')
        await expect(page.locator('body')).toHaveClass(/is-focused/)

        const main = page.locator('.contents > main')
        await expect(main).toHaveClass(/no-projects/)
        await expect(main).toContainText('Welcome to Lode')

        const addBtn = page.locator('.no-projects .btn.btn-primary')
        await expect(addBtn).toHaveText('Add your first project')
        await addBtn.click()

        await expect(page.locator('.modal-header')).toHaveText('Add project')

        const saveBtn = page.locator('.modal-footer .btn-primary')
        await expect(saveBtn).toContainText('Add project')
        await expect(saveBtn).toBeDisabled()

        // Since it's the first time this modal is shown, it should have
        // the help section explaining what a project is.
        await expect(page.locator('.modal-help')).toContainText(
            'Projects allow you to group different repositories and run their tests all at once.',
        )

        await page.locator('#project-name').fill('Biscuit')

        // Before saving, project ready ephemeral listener should not exist.
        const onceListeners = await page.evaluate(() =>
            (window as any).electron.ipcRenderer.listeners.once,
        )
        expect(onceListeners).toEqual({})

        await saveBtn.click()
        await assertEmitted(page, 'project-switch', { name: 'Biscuit' })

        await nextTick(page)
        await expect(page.locator('.loading')).toBeVisible()
        await expect(page.locator('.spinner')).toBeAttached()

        const project = loadFixture('framework/project.json')
        await ipcEvent(page, 'project-ready', project)

        await nextTick(page)
        await assertEmitted(page, 'project-repositories', { id: '42', name: 'Biscuit' })

        await ipcEvent(page, '42:repositories', [])
        await expect(page.locator('.loading')).toHaveCount(0)
        await expect(page.locator('.spinner')).toHaveCount(0)

        await expect(page.locator('.modal-header')).toHaveText('Add repositories to Biscuit')

        const cancelBtn = page.locator('.modal-footer .btn').first()
        await cancelBtn.click()

        await expect(page.locator('.modal-header')).toHaveCount(0)

        await expect(main).not.toHaveClass(/no-projects/)
        await expect(main).toHaveClass(/project/)

        await expect(page.locator('.split')).toHaveClass(/empty/)

        const firstPane = page.locator('.pane').first()
        await expect(firstPane).toHaveClass(/sidebar/)

        await expect(page.locator('.sidebar header .sidebar-header')).toHaveText('Project')
        const sidebarItem = page.locator('.sidebar header .sidebar-item')
        await expect(sidebarItem).toContainText('Biscuit')
        await expect(sidebarItem).toHaveClass(/status--idle/)

        await expect(page.locator('#list')).toHaveClass(/pane/)
        await expect(page.locator('#list h2')).toHaveText('Add repositories to Biscuit')

        const addReposBtn = page.locator('#list .cta .btn-primary')
        await expect(addReposBtn).toHaveText('Add repositories')
        await addReposBtn.click()

        await expect(page.locator('.modal-header')).toHaveText('Add repositories to Biscuit')

        const saveReposBtn = page.locator('.modal-footer .btn-primary')
        await expect(saveReposBtn).toContainText('Add repositories')
        await expect(saveReposBtn).toBeDisabled()
    })

    test('resumes existing projects', async ({ page }) => {
        await start(page, { projectId: '42' })

        // Having a project ID should make the renderer enter loading
        // state instead of showing the Welcome screen.
        await expect(page.locator('.loading')).toBeVisible()
        await expect(page.locator('.spinner')).toBeAttached()

        const project = loadFixture('framework/project.json')
        await ipcEvent(page, 'project-ready', project)

        await nextTick(page)
        await assertEmitted(page, 'project-repositories', { id: '42', name: 'Biscuit' })

        await ipcEvent(page, '42:repositories', [])
        await expect(page.locator('.loading')).toHaveCount(0)
        await expect(page.locator('.spinner')).toHaveCount(0)
        await expect(page.locator('.modal-header')).toHaveCount(0)

        const main = page.locator('.contents > main')
        await expect(main).not.toHaveClass(/no-projects/)
        await expect(main).toHaveClass(/project/)

        await expect(page.locator('.split')).toHaveClass(/empty/)
        await expect(page.locator('.pane').first()).toHaveClass(/sidebar/)

        await expect(page.locator('.sidebar header .sidebar-header').last()).toHaveText('Project')
        const sidebarItem = page.locator('.sidebar header .sidebar-item')
        await expect(sidebarItem).toContainText('Biscuit')
        await expect(sidebarItem).toHaveClass(/status--idle/)

        await expect(page.locator('#list')).toHaveClass(/pane/)
        await expect(page.locator('#list h2')).toHaveText('Add repositories to Biscuit')

        const addReposBtn = page.locator('#list .cta .btn-primary')
        await expect(addReposBtn).toHaveText('Add repositories')
        await addReposBtn.click()

        await expect(page.locator('.modal-header')).toHaveText('Add repositories to Biscuit')
        const saveReposBtn = page.locator('.modal-footer .btn-primary')
        await expect(saveReposBtn).toContainText('Add repositories')
        await expect(saveReposBtn).toBeDisabled()
    })

    test('triggers project context menu', async ({ page }) => {
        await startWithProject(page)

        await nextTick(page)
        await setInvokeHandler(page, {}, 'return Promise.resolve(true)')

        await ipcEvent(page, '42:repositories', [])

        const sidebarItem = page.locator('.sidebar header .sidebar-item')
        await expect(sidebarItem).toContainText('Biscuit')
        await sidebarItem.click({ button: 'right' })
        await assertInvokedOnce(page, 'project-context-menu')
    })
})
