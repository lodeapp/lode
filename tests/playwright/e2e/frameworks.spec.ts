import { expect, test } from '@playwright/test'
import { nextTick, startWithProject } from '../helpers/app'
import {
    assertEmitted,
    assertEmittedOnce,
    assertInvokeCallArgEq,
    assertInvokeCallArgs,
    assertInvokeCallChannel,
    assertInvokedCount,
    assertInvokedOnce,
    assertNormalizedText,
    assertSendCallArgs,
} from '../helpers/assertions'
import { loadFixture } from '../helpers/fixtures'
import {
    ipcEvent,
    ipcResetMockHistory,
    setInvokeHandler,
} from '../helpers/ipc'

test.describe('Framework management', () => {
    let suites: Record<string, any[]>
    let tests: Record<string, any>
    let ledger: Record<string, any>
    let statusMap: Record<string, any>
    let frameworks: any[]
    let repositories: any[]
    let ledgerStub: any
    let frameworkTypes: any

    function addFramework(framework: any, suitesData: any[], testsData?: any) {
        suites[framework.id] = suitesData
        if (testsData) {
            tests[framework.id] = testsData
        }
        ledger[framework.id] = {
            ...ledgerStub,
            idle: suitesData.length,
        }
        statusMap[framework.id] = suitesData.reduce((obj: any, item: any) => ({
            ...obj,
            [item.file]: 'idle',
        }), {})
        frameworks.push(framework)
    }

    test.beforeEach(async () => {
        suites = {}
        tests = {}
        ledger = {}
        statusMap = {}
        frameworks = []

        ledgerStub = loadFixture('framework/ledger.json')
        const allRepos = loadFixture<any[]>('framework/repositories.json')
        // Use only one repository, for simplicity.
        repositories = allRepos.slice(0, 1)

        const jestFramework = loadFixture('framework/jest/26/options.json')
        const jestSuites = loadFixture<any[]>('framework/jest/26/suites.json')
        addFramework(jestFramework, jestSuites)

        const phpunitFramework = loadFixture('framework/phpunit/8.0/options.json')
        const phpunitSuites = loadFixture<any[]>('framework/phpunit/8.0/suites.json')
        const phpunitTests = loadFixture('framework/phpunit/8.0/tests.json')
        addFramework(phpunitFramework, phpunitSuites, phpunitTests)

        frameworkTypes = loadFixture('framework/types.json')
    })

    async function setupDefaultResolver(page: any) {
        await setInvokeHandler(page, { frameworks, ledger, statusMap }, `
            const f = window.__fixtures__
            switch (method) {
                case 'repository-frameworks': return f.frameworks
                case 'repository-exists': return true
                case 'framework-get':
                    return Promise.resolve(f.frameworks.find(fw => fw.id === args[0]))
                case 'framework-get-ledger':
                    return {
                        ledger: f.ledger[args[0]],
                        status: f.statusMap[args[0]]
                    }
            }
            return Promise.resolve()
        `)
    }

    test('manages existing frameworks', async ({ page }) => {
        await startWithProject(page)

        await nextTick(page)
        await setupDefaultResolver(page)

        await ipcEvent(page, '42:repositories', repositories)
        await nextTick(page)
        await assertInvokedOnce(page, 'repository-frameworks', 'repository-1')
        await ipcResetMockHistory(page)

        await ipcEvent(page, 'framework-active', 'jest-1', repositories[0])
        await nextTick(page)

        await assertSendCallArgs(page, 0, 'project-active-framework', 'jest-1')
        await assertSendCallArgs(page, 1, 'framework-suites', 'jest-1')
        await assertInvokeCallArgs(page, 0, 'repository-exists', 'repository-1')
        await assertInvokeCallArgs(page, 1, 'framework-get', 'jest-1')
        await assertInvokeCallArgs(page, 2, 'framework-get-ledger', 'jest-1')
        await ipcResetMockHistory(page)

        await ipcEvent(page, 'jest-1:refreshed', suites['jest-1'], suites['jest-1'].length)

        const firstFramework = page.locator('.sidebar section.scrollable .sidebar-item--framework').first()
        await expect(firstFramework).toContainText('Jest')
        await expect(firstFramework).toHaveClass(/status--idle/)
        await expect(firstFramework).toHaveClass(/is-active/)

        const lastFramework = page.locator('.sidebar section.scrollable .sidebar-item--framework').last()
        await expect(lastFramework).toHaveClass(/status--idle/)
        await expect(lastFramework).not.toHaveClass(/is-active/)
        await expect(lastFramework).toContainText('PHPUnit')

        await expect(page.locator('.split')).not.toHaveClass(/empty/)

        const results = page.locator('#results .results')
        await expect(results).toHaveClass(/blankslate/)
        await expect(results).toContainText('No test selected')

        const framework = page.locator('#list .framework')
        await expect(framework).toHaveClass(/status--idle/)
        await expect(framework.locator('.heading .name')).toContainText('Jest')

        await expect(framework.locator('.actions button')).toHaveCount(4)
        await expect(framework.locator('.actions button').nth(0)).toHaveClass(/more-actions/)
        await expect(framework.locator('.actions button').nth(2)).toHaveClass(/btn-primary/)
        await expect(framework.locator('.actions button').nth(2)).toContainText('Run')
        await expect(framework.locator('.actions button').nth(3)).not.toHaveClass(/btn-primary/)
        await expect(framework.locator('.actions button').nth(3)).toContainText('Stop')
        await expect(framework.locator('.actions button').nth(3)).toBeDisabled()

        await expect(page.locator('.filters .progress-breakdown .Label')).toHaveCount(1)
        await assertNormalizedText(page.locator('.filters .progress-breakdown .Label--idle'), '15 idle')

        await expect(page.locator('.search')).toBeAttached()
        await expect(page.locator('.sort')).toContainText('15 items sorted by Name')

        const nuggets = page.locator('.framework > .children > .nugget')
        await expect(nuggets).toHaveCount(15)
        await expect(page.locator('.framework > .children > .nugget.is-collapsed.has-children')).toHaveCount(15)

        await assertNormalizedText(nuggets.nth(0).locator('.filename > .dir'), '__tests__/')
        await assertNormalizedText(nuggets.nth(0).locator('.filename > .name'), 'BadlyNested.spec.js')

        // Switch framework
        await lastFramework.click()

        await assertSendCallArgs(page, 0, 'project-active-framework', 'phpunit-1')
        await assertSendCallArgs(page, 1, 'framework-suites', 'phpunit-1')
        await assertInvokeCallArgs(page, 0, 'repository-exists', 'repository-1')
        await assertInvokeCallArgs(page, 1, 'framework-get', 'phpunit-1')
        await assertInvokeCallArgs(page, 2, 'framework-get-ledger', 'phpunit-1')
        await ipcResetMockHistory(page)

        await ipcEvent(page, 'phpunit-1:refreshed', suites['phpunit-1'], suites['phpunit-1'].length)

        await expect(framework).toHaveClass(/status--idle/)
        await expect(framework.locator('.heading .name')).toContainText('PHPUnit')

        await expect(framework.locator('.actions button')).toHaveCount(4)
        await expect(framework.locator('.actions button').nth(0)).toHaveClass(/more-actions/)
        await expect(framework.locator('.actions button').nth(2)).toHaveClass(/btn-primary/)
        await expect(framework.locator('.actions button').nth(2)).toContainText('Run')
        await expect(framework.locator('.actions button').nth(3)).not.toHaveClass(/btn-primary/)
        await expect(framework.locator('.actions button').nth(3)).toContainText('Stop')
        await expect(framework.locator('.actions button').nth(3)).toBeDisabled()

        await expect(page.locator('.filters .progress-breakdown .Label')).toHaveCount(1)
        await assertNormalizedText(page.locator('.filters .progress-breakdown .Label--idle'), '14 idle')

        await expect(page.locator('.search')).toBeAttached()
        await expect(page.locator('.sort')).toContainText('14 items sorted by Running order')

        await expect(nuggets).toHaveCount(14)
        await expect(page.locator('.framework > .children > .nugget.is-collapsed')).toHaveCount(14)

        // Count nuggets with children
        await expect(page.locator('.framework > .children > .nugget.has-children')).toHaveCount(13)

        const withoutChildren = page.locator('.framework > .children > .nugget:not(.has-children)')
        await assertNormalizedText(withoutChildren.locator('.filename > .name'), 'EmptyTest.php')

        await assertNormalizedText(nuggets.nth(0).locator('.filename > .dir'), 'tests/Unit/')
        await assertNormalizedText(nuggets.nth(0).locator('.filename > .name'), 'ConsoleTest.php')

        // Expand first nugget
        await nuggets.nth(0).click()
        await assertEmittedOnce(page, 'framework-toggle-child', 'phpunit-1', ['/lodeapp/lode/hobnobs/tests/Unit/ConsoleTest.php'], true)
        await ipcResetMockHistory(page)

        await ipcEvent(page, '/lodeapp/lode/hobnobs/tests/Unit/ConsoleTest.php:framework-tests', tests['phpunit-1']['/lodeapp/lode/hobnobs/tests/Unit/ConsoleTest.php'],
        )

        // Expand second nugget
        await assertNormalizedText(nuggets.nth(1).locator('.filename > .name'), 'DataProviderTest.php')
        await nuggets.nth(1).click()
        await assertEmittedOnce(page, 'framework-toggle-child', 'phpunit-1', ['/lodeapp/lode/hobnobs/tests/Unit/DataProviderTest.php'], true)
        await ipcResetMockHistory(page)

        await ipcEvent(page, '/lodeapp/lode/hobnobs/tests/Unit/DataProviderTest.php:framework-tests', tests['phpunit-1']['/lodeapp/lode/hobnobs/tests/Unit/DataProviderTest.php'],
        )

        // Check expanded first nugget's children
        await expect(nuggets.nth(0)).toHaveClass(/is-expanded/)
        const firstChildren = nuggets.nth(0).locator('.nugget-items > .nugget')
        await expect(firstChildren).toHaveCount(8)
        for (const child of await firstChildren.all()) {
            await expect(child).toHaveClass(/test/)
            await expect(child).toHaveClass(/status--idle/)
            await expect(child).toHaveClass(/is-collapsed/)
        }
        await assertNormalizedText(
            nuggets.nth(0).locator('.nugget-items > .nugget').first().locator('.test-name'),
            'Console log null',
        )

        // Check expanded second nugget's children
        await expect(nuggets.nth(1)).toHaveClass(/is-expanded/)
        const secondChildren = nuggets.nth(1).locator('.nugget-items > .nugget')
        await expect(secondChildren).toHaveCount(9)
        for (const child of await secondChildren.all()) {
            await expect(child).toHaveClass(/test/)
            await expect(child).toHaveClass(/status--idle/)
            await expect(child).toHaveClass(/is-collapsed/)
        }
        await assertNormalizedText(
            nuggets.nth(1).locator('.nugget-items > .nugget').first().locator('.test-name'),
            'Data provider success with data set # 0',
        )

        // Collapse second nugget
        const header = nuggets.nth(1).locator('> .header')
        await header.click()
        await assertEmittedOnce(page, 'framework-toggle-child', 'phpunit-1', ['/lodeapp/lode/hobnobs/tests/Unit/DataProviderTest.php'], false)
        await ipcResetMockHistory(page)

        await expect(nuggets.nth(1)).toHaveClass(/is-collapsed/)
        await expect(page.locator('.framework > .children > .nugget.is-expanded')).toHaveCount(1)
    })

    test('can filter suites', async ({ page }) => {
        await startWithProject(page)

        await nextTick(page)

        // Modify the Jest framework's statuses to all passed
        const modifiedLedger = { ...ledger }
        modifiedLedger['jest-1'] = Object.fromEntries(
            Object.entries(modifiedLedger['jest-1']).map(([key, value]) => {
                if (key === 'idle')
                    return [key, 0]
                if (key === 'passed')
                    return [key, suites['jest-1'].length]
                return [key, value]
            }),
        )
        const modifiedStatusMap = { ...statusMap }
        modifiedStatusMap['jest-1'] = Object.fromEntries(
            Object.entries(modifiedStatusMap['jest-1']).map(([key]) => [key, 'passed']),
        )

        await setInvokeHandler(page, { frameworks, ledger: modifiedLedger, statusMap: modifiedStatusMap }, `
            const f = window.__fixtures__
            switch (method) {
                case 'repository-frameworks': return f.frameworks
                case 'repository-exists': return true
                case 'framework-get':
                    return Promise.resolve(f.frameworks.find(fw => fw.id === args[0]))
                case 'framework-get-ledger':
                    return {
                        ledger: f.ledger[args[0]],
                        status: f.statusMap[args[0]]
                    }
            }
            return Promise.resolve()
        `)

        await ipcEvent(page, '42:repositories', repositories)
        await ipcEvent(page, 'framework-active', 'jest-1', repositories[0])
        await nextTick(page)
        await ipcEvent(page, 'jest-1:refreshed', suites['jest-1'], suites['jest-1'].length)
        await nextTick(page)
        await ipcResetMockHistory(page)

        await expect(page.locator('.cutoff')).toHaveCount(0)

        const run = page.locator('.actions .btn-primary')
        await assertNormalizedText(run, 'Run')

        await expect(page.locator('.framework')).not.toHaveClass(/selective/)

        const nuggets = page.locator('.framework > .children > .nugget')
        await expect(nuggets).toHaveCount(15)
        for (const nugget of await nuggets.all()) {
            await expect(nugget).toHaveClass(/status--passed/)
        }

        const passedLabel = page.locator('.filters .progress-breakdown > .Label')
        await expect(passedLabel).toHaveCount(1)
        await expect(passedLabel).toHaveClass(/Label--passed/)
        await expect(passedLabel).not.toHaveClass(/is-active/)

        await passedLabel.click()
        await expect(passedLabel).toHaveClass(/is-active/)
        await assertEmittedOnce(page, 'framework-filter', 'jest-1', 'status', ['passed'])
        await ipcResetMockHistory(page)

        await assertNormalizedText(run, 'Run matches 15')

        // Select first nugget (checkbox hidden via opacity:0, button visible)
        await expect(nuggets.nth(0).locator('.selective-toggle input')).toHaveCSS('opacity', '0')
        await nuggets.nth(0).locator('.selective-toggle button').click()
        await expect(nuggets.nth(0).locator('.selective-toggle input')).toHaveCSS('opacity', '1')
        await expect(nuggets.nth(0).locator('.selective-toggle button')).toHaveCSS('opacity', '0')
        await expect(page.locator('.framework')).toHaveClass(/selective/)

        // Select second nugget
        await nuggets.nth(1).locator('> .header button').click()

        await assertSendCallArgs(page, 0, 'framework-select', 'jest-1', ['/lodeapp/lode/hobnobs/__tests__/BadlyNested.spec.js'], true,
        )
        await assertSendCallArgs(page, 1, 'framework-select', 'jest-1', ['/lodeapp/lode/hobnobs/__tests__/Console.spec.js'], true,
        )
        await ipcResetMockHistory(page)

        await ipcEvent(page, 'jest-1:selective', 2)

        const labels = page.locator('.filters .progress-breakdown > .Label')
        await expect(labels).toHaveCount(2)
        const selectedLabel = page.locator('.filters .progress-breakdown > .Label').first()
        await expect(selectedLabel).toHaveClass(/Label--selected/)
        await expect(selectedLabel).not.toHaveClass(/is-active/)

        await selectedLabel.click()
        await assertEmittedOnce(page, 'framework-filter', 'jest-1', 'status', ['passed', 'selected'])
        await ipcResetMockHistory(page)

        // Return only a subset of suites: the selected ones
        await ipcEvent(page, 'jest-1:refreshed', suites['jest-1'].slice(0, 2), 2)
        await expect(nuggets).toHaveCount(2)
        for (const nugget of await nuggets.all()) {
            await expect(nugget).toHaveClass(/status--passed/)
        }

        const checkboxes = nuggets.locator('input')
        for (const checkbox of await checkboxes.all()) {
            await expect(checkbox).toBeChecked()
        }

        // Deactivate passed filter
        await page.locator('.filters .progress-breakdown > .Label--passed').click()
        await expect(page.locator('.filters .progress-breakdown > .Label--passed')).not.toHaveClass(/is-active/)
        await expect(nuggets).toHaveCount(2)

        // Deselect second nugget
        await nuggets.nth(1).locator('> .header button').click()
        await expect(nuggets).toHaveCount(1)
        await assertSendCallArgs(page, 1, 'framework-select', 'jest-1', ['/lodeapp/lode/hobnobs/__tests__/Console.spec.js'], false,
        )
        await ipcResetMockHistory(page)

        // Deselect first nugget
        await nuggets.nth(0).locator('> .header button').click()

        // Clear the selected filter
        await page.locator('.filters .progress-breakdown > .Label--selected').click()

        await assertSendCallArgs(page, 1, 'framework-filter', 'jest-1', 'status', [])
        await ipcResetMockHistory(page)

        await ipcEvent(page, 'jest-1:selective', 0)
        await ipcEvent(page, 'jest-1:refreshed',
            // Clone the suites array since it's used elsewhere
            [...suites['jest-1']], suites['jest-1'].length)

        await expect(page.locator('.framework')).not.toHaveClass(/selective/)
        await expect(nuggets).toHaveCount(15)
        for (const nugget of await nuggets.all()) {
            await expect(nugget).toHaveClass(/status--passed/)
        }

        await expect(labels).toHaveCount(1)
        await expect(labels).toHaveClass(/Label--passed/)
        await expect(labels).not.toHaveClass(/is-active/)

        // Simulate a suite failing. It should remain in the list,
        // as we're not filtering for status.
        const failLedger1 = { ...modifiedLedger['jest-1'] }
        const failStatusMap1 = { ...modifiedStatusMap['jest-1'] }
        failLedger1.passed -= 1
        failLedger1.failed = (failLedger1.failed || 0) + 1
        failStatusMap1['/lodeapp/lode/hobnobs/__tests__/Console.spec.js'] = 'failed'

        await ipcEvent(page, 'jest-1:ledger', failLedger1, failStatusMap1)

        await expect(nuggets).toHaveCount(15)
        await expect(page.locator('.framework > .children > .nugget.status--passed')).toHaveCount(14)
        await expect(page.locator('.framework > .children > .nugget.status--failed')).toHaveCount(1)
        await assertNormalizedText(
            page.locator('.framework > .children > .nugget.status--failed .filename > .name'),
            'Console.spec.js',
        )

        // Reset the failed status for the next assertion
        await ipcEvent(page, 'jest-1:ledger', modifiedLedger['jest-1'], modifiedStatusMap['jest-1'])

        // Now filter by passed and simulate a failure again
        await page.locator('.filters .progress-breakdown > .Label--passed').click()
        await ipcResetMockHistory(page)

        // Simulate a suite failing again. This time it should be
        // removed from view, as we're filtering by a different status.
        await ipcEvent(page, 'jest-1:ledger', failLedger1, failStatusMap1)

        await expect(nuggets).toHaveCount(14)
        for (const nugget of await nuggets.all()) {
            await expect(nugget).toHaveClass(/status--passed/)
        }

        await expect(page.locator('.filters .progress-breakdown > .Label--failed')).not.toHaveClass(/is-active/)
        await assertNormalizedText(page.locator('.filters .progress-breakdown > .Label--failed'), '1 failed')

        await assertNormalizedText(run, 'Run matches 14')

        const cutoff = page.locator('.cutoff')
        await expect(cutoff).toBeAttached()
        await assertNormalizedText(cutoff, '1 hidden item\nClear filters')

        await cutoff.locator('button').click()
        await assertEmittedOnce(page, 'framework-reset-filters', 'jest-1')
        await ipcResetMockHistory(page)

        await ipcEvent(page, 'jest-1:ledger', modifiedLedger['jest-1'], modifiedStatusMap['jest-1'])
        await ipcEvent(page, 'jest-1:refreshed', suites['jest-1'], suites['jest-1'].length)

        await assertNormalizedText(run, 'Run')
        await expect(page.locator('.cutoff')).toHaveCount(0)
        await expect(nuggets).toHaveCount(15)
    })

    test('suites are deselected when not in view', async ({ page }) => {
        await startWithProject(page)

        await nextTick(page)
        await setupDefaultResolver(page)

        await ipcEvent(page, '42:repositories', repositories)
        await ipcEvent(page, 'framework-active', 'jest-1', repositories[0])
        await nextTick(page)
        await ipcEvent(page, 'jest-1:refreshed', suites['jest-1'], suites['jest-1'].length)

        // Create a ledger with one failed suite
        const mixedLedger = { ...ledger['jest-1'] }
        const mixedStatusMap = { ...statusMap['jest-1'] }
        mixedLedger.idle -= 1
        mixedLedger.failed = (mixedLedger.failed || 0) + 1
        mixedStatusMap['/lodeapp/lode/hobnobs/__tests__/Console.spec.js'] = 'failed'

        await ipcEvent(page, 'jest-1:ledger', mixedLedger, mixedStatusMap)

        const run = page.locator('.actions .btn-primary')
        await assertNormalizedText(run, 'Run')

        // Click each filter label
        const filterLabels = page.locator('.filters .progress-breakdown > .Label')
        const labelCount = await filterLabels.count()
        for (let i = 0; i < labelCount; i++) {
            await filterLabels.nth(i).click()
        }

        // Select first two nuggets
        const nuggets = page.locator('.framework > .children > .nugget')
        await nuggets.nth(0).locator('> .header button').click()
        await nuggets.nth(1).locator('> .header button').click()
        await ipcResetMockHistory(page)

        // Change the status of Console.spec.js from failed to passed,
        // which should cause it to be deselected (since it's no longer matching the filter)
        const updatedLedger = { ...ledger['jest-1'] }
        const updatedStatusMap = { ...statusMap['jest-1'] }
        updatedLedger.idle -= 1
        updatedLedger.passed = (updatedLedger.passed || 0) + 1
        updatedStatusMap['/lodeapp/lode/hobnobs/__tests__/Console.spec.js'] = 'passed'

        await ipcEvent(page, 'jest-1:ledger', updatedLedger, updatedStatusMap)

        await nextTick(page)
        await assertEmittedOnce(page, 'framework-select', 'jest-1', ['/lodeapp/lode/hobnobs/__tests__/Console.spec.js'], false,
        )

        await assertNormalizedText(run, 'Run selected 1')
        await assertNormalizedText(
            page.locator('.filters .progress-breakdown > .Label--selected'),
            '1 selected',
        )
        await expect(page.locator('.filters .progress-breakdown > .Label--failed')).toHaveClass(/is-active/)
        await assertNormalizedText(
            page.locator('.filters .progress-breakdown > .Label--failed'),
            '0 failed',
        )
    })

    test('handles framework actions', async ({ page }) => {
        await startWithProject(page)

        await nextTick(page)
        await setupDefaultResolver(page)

        await ipcEvent(page, '42:repositories', repositories)
        await ipcEvent(page, 'framework-active', 'jest-1', repositories[0])
        await nextTick(page)
        await ipcEvent(page, 'jest-1:refreshed', suites['jest-1'], suites['jest-1'].length)
        await ipcResetMockHistory(page)

        const framework = page.locator('.framework')
        await expect(framework).toHaveClass(/status--idle/)

        const status = framework.locator('.title .status')
        await expect(status).toHaveClass(/status--idle/)

        const actions = page.locator('.framework > .header .actions')

        // Click more-actions button
        await actions.locator('.more-actions').click()
        // Third argument of context menu is positioning object, so we can ignore that.
        await assertInvokeCallChannel(page, 0, 'framework-context-menu')
        await assertInvokeCallArgEq(page, 0, 1, 'jest-1')
        await ipcResetMockHistory(page)

        // Click Run button
        const runBtn = actions.locator('.btn-primary')
        await assertNormalizedText(runBtn, 'Run')
        await runBtn.click()
        await assertEmittedOnce(page, 'framework-start', 'jest-1')

        // Without any IPC interaction, status of framework should be
        // optimistically set to "queued".
        await expect(framework).toHaveClass(/status--queued/)
        await expect(status).toHaveClass(/status--queued/)
        await ipcResetMockHistory(page)

        await expect(runBtn).toBeDisabled()

        const refreshBtn = actions.locator('.btn-sm').first()
        await expect(refreshBtn).toBeDisabled()

        const stopBtn = actions.locator('.btn-sm').last()
        await assertNormalizedText(stopBtn, 'Stop')
        await expect(stopBtn).not.toBeDisabled()
        await stopBtn.click()
        await assertEmittedOnce(page, 'framework-stop', 'jest-1')
        await ipcResetMockHistory(page)

        await ipcEvent(page, 'jest-1:status:list', 'idle', 'running')

        await expect(runBtn).not.toBeDisabled()
        await expect(refreshBtn).not.toBeDisabled()
        await refreshBtn.click()
        await assertEmittedOnce(page, 'framework-refresh', 'jest-1')

        await ipcEvent(page, 'jest-1:status:list', 'idle', 'running')
        await expect(framework).toHaveClass(/status--idle/)
        await expect(status).toHaveClass(/status--idle/)
        await ipcResetMockHistory(page)
    })

    test('can focus on framework filter from application menu', async ({ page }) => {
        await startWithProject(page)

        await nextTick(page)
        await setupDefaultResolver(page)

        await ipcEvent(page, '42:repositories', repositories)
        await ipcEvent(page, 'framework-active', 'jest-1', repositories[0])
        await nextTick(page)
        await ipcEvent(page, 'jest-1:refreshed', suites['jest-1'], suites['jest-1'].length)
        await ipcResetMockHistory(page)

        await ipcEvent(page, 'menu-event', { name: 'filter' })
        await nextTick(page)

        await expect(page.locator('.filters.search input')).toBeFocused()
    })
})
