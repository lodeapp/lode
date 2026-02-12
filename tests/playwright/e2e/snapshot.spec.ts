import { expect, test } from '@playwright/test'
import { nextTick, start, startWithSnapshot } from '../helpers/app'
import {
    assertEmittedOnce,
    assertInvokeCallArgs,
    assertInvokedCount,
    assertNormalizedText,
    assertSendCallArgs,
} from '../helpers/assertions'
import { loadFixture } from '../helpers/fixtures'
import {
    ipcEvent,
    ipcResetMockHistory,
    setInvokeHandler,
} from '../helpers/ipc'

test.describe('Snapshot / results file', () => {
    let suites: Record<string, any[]>
    let tests: Record<string, any>
    let testResults: Record<string, any>
    let ledger: Record<string, any>
    let statusMap: Record<string, any>
    let frameworks: Record<string, any[]>
    let repositories: any[]

    test.beforeEach(async () => {
        repositories = loadFixture<any[]>('snapshot/repositories.json')
        frameworks = loadFixture<Record<string, any[]>>('snapshot/frameworks.json')
        suites = loadFixture<Record<string, any[]>>('snapshot/suites.json')
        tests = loadFixture('snapshot/tests.json')
        testResults = loadFixture('snapshot/test-results.json')
        ledger = loadFixture<Record<string, any>>('snapshot/ledger.json')
        statusMap = loadFixture<Record<string, any>>('snapshot/status-map.json')
    })

    async function setupSnapshotResolver(page: any) {
        await setInvokeHandler(page, { frameworks, ledger, statusMap, tests, testResults }, `
            const f = window.__fixtures__
            switch (method) {
                case 'repository-frameworks': {
                    const repoId = args[0]
                    return f.frameworks[repoId] || []
                }
                case 'repository-exists': return true
                case 'framework-get': {
                    const fwId = args[0]
                    for (const repoFws of Object.values(f.frameworks)) {
                        const found = repoFws.find(fw => fw.id === fwId)
                        if (found) return Promise.resolve(found)
                    }
                    return Promise.resolve(null)
                }
                case 'framework-get-ledger':
                    return {
                        ledger: f.ledger[args[0]],
                        status: f.statusMap[args[0]]
                    }
                case 'test-get': {
                    const fwId = args[0]
                    const context = args[1]
                    let fw = null
                    for (const repoFws of Object.values(f.frameworks)) {
                        const found = repoFws.find(fw => fw.id === fwId)
                        if (found) { fw = found; break }
                    }
                    const suitePath = context[0]
                    const testId = context[1]
                    const suiteTests = f.tests[suitePath] || []
                    const test = suiteTests.find(t => t.id === testId)
                    return {
                        framework: fw,
                        nuggets: [
                            { name: suitePath, relative: suitePath },
                            test
                        ],
                        results: f.testResults[testId] || {}
                    }
                }
                case 'test-feedback-text':
                    return args[0]
            }
            return Promise.resolve()
        `)
    }

    async function activateFirstFramework(page: any) {
        await startWithSnapshot(page)
        await nextTick(page)
        await setupSnapshotResolver(page)

        await ipcEvent(page, 'snap-project-1:repositories', repositories)
        await nextTick(page)
        await ipcResetMockHistory(page)

        await ipcEvent(page, 'framework-active', 'snap-jest-1', repositories[0])
        await nextTick(page)
        await ipcResetMockHistory(page)

        await ipcEvent(page, 'snap-jest-1:refreshed', suites['snap-jest-1'], suites['snap-jest-1'].length)
        await nextTick(page)
    }

    // ---------------------------------------------------------------
    // Sidebar rendering
    // ---------------------------------------------------------------

    test.describe('Sidebar rendering', () => {
        test('shows snapshot metadata', async ({ page }) => {
            await activateFirstFramework(page)

            // File section: name and last-run timestamp
            const fileItem = page.locator('.snapshot-file')
            await expect(fileItem).toBeVisible()
            await expect(fileItem.locator('.heading')).toContainText('results')
            await expect(fileItem.locator('.extension')).toContainText('.lode')
            await expect(fileItem.locator('.snapshot-file-meta')).toBeVisible()

            // Git branch shown under the repository
            const branch = page.locator('.snapshot-branch')
            await expect(branch).toBeVisible()
            await expect(branch).toContainText('main')
        })

        test('shows repositories and frameworks in sidebar', async ({ page }) => {
            await activateFirstFramework(page)

            const sidebarFrameworks = page.locator('.sidebar section.scrollable .sidebar-item--framework')
            await expect(sidebarFrameworks).toHaveCount(2)

            await expect(sidebarFrameworks.nth(0)).toContainText('Jest')
            await expect(sidebarFrameworks.nth(1)).toContainText('PHPUnit')
        })

        test('hides the "Add repositories" button', async ({ page }) => {
            await activateFirstFramework(page)

            await expect(page.locator('.sidebar-action')).toHaveCount(0)
        })

        test('can switch active framework by clicking sidebar', async ({ page }) => {
            await activateFirstFramework(page)
            await ipcResetMockHistory(page)

            const secondFramework = page.locator('.sidebar section.scrollable .sidebar-item--framework').nth(1)
            await secondFramework.locator('.header').click()

            await assertSendCallArgs(page, 0, 'project-active-framework', 'snap-phpunit-1')
            await ipcResetMockHistory(page)

            await ipcEvent(page, 'framework-active', 'snap-phpunit-1', repositories[0])
            await nextTick(page)
            await ipcResetMockHistory(page)

            await ipcEvent(page, 'snap-phpunit-1:refreshed', suites['snap-phpunit-1'], suites['snap-phpunit-1'].length)
            await nextTick(page)

            const framework = page.locator('#list .framework')
            await expect(framework.locator('.heading .name')).toContainText('PHPUnit')
        })
    })

    // ---------------------------------------------------------------
    // Read-only mode
    // ---------------------------------------------------------------

    test.describe('Read-only mode', () => {
        test('hides the actions bar (Run, Stop, Refresh)', async ({ page }) => {
            await activateFirstFramework(page)

            const framework = page.locator('#list .framework')
            await expect(framework.locator('.actions')).toHaveCount(0)
        })

        test('hides suite selection checkboxes', async ({ page }) => {
            await activateFirstFramework(page)

            await expect(page.locator('.selective-toggle')).toHaveCount(0)
        })

        test('does not trigger context menu on sidebar framework right-click', async ({ page }) => {
            await activateFirstFramework(page)
            await ipcResetMockHistory(page)

            const firstFramework = page.locator('.sidebar section.scrollable .sidebar-item--framework').first()
            await firstFramework.locator('.header').click({ button: 'right' })
            await nextTick(page)

            await assertInvokedCount(page, 0)
        })

        test('does not trigger context menu on project right-click', async ({ page }) => {
            await activateFirstFramework(page)
            await ipcResetMockHistory(page)

            const projectItem = page.locator('.sidebar > header > .sidebar-item.has-status')
            await projectItem.click({ button: 'right' })
            await nextTick(page)

            await assertInvokedCount(page, 0)
        })

        test('shows read-only CTA when no repositories', async ({ page }) => {
            await startWithSnapshot(page)
            await nextTick(page)
            await setupSnapshotResolver(page)

            // Send empty repositories
            await ipcEvent(page, 'snap-project-1:repositories', [])
            await nextTick(page)

            await expect(page.locator('.cta')).toContainText('No repositories in this results file')
        })

        test('shows read-only CTA when no frameworks', async ({ page }) => {
            // Override frameworks to return empty
            await startWithSnapshot(page)
            await nextTick(page)

            await setInvokeHandler(page, {}, `
                switch (method) {
                    case 'repository-frameworks': return []
                    case 'repository-exists': return true
                }
                return Promise.resolve()
            `)

            await ipcEvent(page, 'snap-project-1:repositories', repositories)
            await nextTick(page)

            // Activate the first repo but with no frameworks returned
            // The framework-active event won't fire, so we stay in the "no framework" state
            await expect(page.locator('.cta')).toContainText('No frameworks in this results file')
        })

        test('shows "No tests loaded." without Refresh link', async ({ page }) => {
            await startWithSnapshot(page)
            await nextTick(page)

            // Set up a resolver that returns a framework with an empty ledger
            const emptyLedger = {
                queued: 0, running: 0, passed: 0, failed: 0,
                incomplete: 0, skipped: 0, warning: 0, partial: 0,
                empty: 0, idle: 0, error: 0,
            }
            await setInvokeHandler(page, { frameworks, emptyLedger }, `
                const f = window.__fixtures__
                switch (method) {
                    case 'repository-frameworks': {
                        const repoId = args[0]
                        return f.frameworks[repoId] || []
                    }
                    case 'repository-exists': return true
                    case 'framework-get': {
                        const fwId = args[0]
                        for (const repoFws of Object.values(f.frameworks)) {
                            const found = repoFws.find(fw => fw.id === fwId)
                            if (found) return Promise.resolve(found)
                        }
                        return Promise.resolve(null)
                    }
                    case 'framework-get-ledger':
                        return {
                            ledger: f.emptyLedger,
                            status: {}
                        }
                }
                return Promise.resolve()
            `)

            await ipcEvent(page, 'snap-project-1:repositories', repositories)
            await nextTick(page)

            await ipcEvent(page, 'framework-active', 'snap-jest-1', repositories[0])
            await nextTick(page)

            // Send empty suites
            await ipcEvent(page, 'snap-jest-1:refreshed', [], 0)
            await nextTick(page)

            const filters = page.locator('#list .framework .filters')
            await expect(filters).toContainText('No tests loaded.')
            // Should NOT contain a Refresh link
            await expect(filters.locator('a')).toHaveCount(0)
        })
    })

    // ---------------------------------------------------------------
    // Results browsing
    // ---------------------------------------------------------------

    test.describe('Results browsing', () => {
        test('shows suites with correct statuses', async ({ page }) => {
            await activateFirstFramework(page)

            const nuggets = page.locator('.framework > .children > .nugget')
            await expect(nuggets).toHaveCount(5)

            // Verify specific statuses based on the status-map fixture
            await expect(nuggets.nth(0)).toHaveClass(/status--passed/)
            await expect(nuggets.nth(0)).toContainText('Auth.spec.js')

            await expect(nuggets.nth(1)).toHaveClass(/status--failed/)
            await expect(nuggets.nth(1)).toContainText('Cart.spec.js')

            await expect(nuggets.nth(2)).toHaveClass(/status--passed/)
            await expect(nuggets.nth(2)).toContainText('Order.spec.js')

            await expect(nuggets.nth(3)).toHaveClass(/status--skipped/)
            await expect(nuggets.nth(3)).toContainText('Payment.spec.js')

            await expect(nuggets.nth(4)).toHaveClass(/status--passed/)
            await expect(nuggets.nth(4)).toContainText('User.spec.js')
        })

        test('shows correct ledger breakdown', async ({ page }) => {
            await activateFirstFramework(page)

            const labels = page.locator('.filters .progress-breakdown .Label')
            await expect(labels).toHaveCount(3)

            await assertNormalizedText(page.locator('.filters .progress-breakdown .Label--passed'), '3 passed')
            await assertNormalizedText(page.locator('.filters .progress-breakdown .Label--failed'), '1 failed')
            await assertNormalizedText(page.locator('.filters .progress-breakdown .Label--skipped'), '1 skipped')
        })

        test('can filter suites by status', async ({ page }) => {
            await activateFirstFramework(page)

            const passedLabel = page.locator('.filters .progress-breakdown .Label--passed')
            await passedLabel.click()
            await expect(passedLabel).toHaveClass(/is-active/)

            await assertEmittedOnce(page, 'framework-filter', 'snap-jest-1', 'status', ['passed'])
            await ipcResetMockHistory(page)

            // After filtering, send only the matching suites
            const passedSuites = suites['snap-jest-1'].filter(
                (_: any, i: number) => [0, 2, 4].includes(i),
            )
            await ipcEvent(page, 'snap-jest-1:refreshed', passedSuites, passedSuites.length)
            await nextTick(page)

            const nuggets = page.locator('.framework > .children > .nugget')
            await expect(nuggets).toHaveCount(3)
            for (const nugget of await nuggets.all()) {
                await expect(nugget).toHaveClass(/status--passed/)
            }
        })

        test('can expand a suite to see its tests', async ({ page }) => {
            await activateFirstFramework(page)

            const nuggets = page.locator('.framework > .children > .nugget')
            const firstNugget = nuggets.nth(0)

            // Click header to expand
            await firstNugget.locator('> .header').click()
            await assertEmittedOnce(page, 'framework-toggle-child', 'snap-jest-1', ['/projects/backend/__tests__/Auth.spec.js'], true)
            await ipcResetMockHistory(page)

            // Send test data for the expanded suite
            await ipcEvent(
                page,
                '/projects/backend/__tests__/Auth.spec.js:framework-tests',
                tests['/projects/backend/__tests__/Auth.spec.js'],
            )
            await nextTick(page)

            await expect(firstNugget).toHaveClass(/is-expanded/)
            const children = firstNugget.locator('.nugget-items > .nugget')
            await expect(children).toHaveCount(3)

            // Child tests render with status from the status store
            // (idle by default, as only suite-level statuses are set)
            for (const child of await children.all()) {
                await expect(child).toHaveClass(/test/)
                await expect(child).toHaveClass(/status--idle/)
            }

            await assertNormalizedText(
                children.nth(0).locator('.test-name'),
                'should authenticate valid user',
            )
            await assertNormalizedText(
                children.nth(1).locator('.test-name'),
                'should reject invalid credentials',
            )
            await assertNormalizedText(
                children.nth(2).locator('.test-name'),
                'should handle token refresh',
            )
        })

        test('can expand a suite with failed tests', async ({ page }) => {
            await activateFirstFramework(page)

            const nuggets = page.locator('.framework > .children > .nugget')
            const cartNugget = nuggets.nth(1) // Cart.spec.js — failed

            await cartNugget.locator('> .header').click()
            await assertEmittedOnce(page, 'framework-toggle-child', 'snap-jest-1', ['/projects/backend/__tests__/Cart.spec.js'], true)
            await ipcResetMockHistory(page)

            await ipcEvent(
                page,
                '/projects/backend/__tests__/Cart.spec.js:framework-tests',
                tests['/projects/backend/__tests__/Cart.spec.js'],
            )
            await nextTick(page)

            await expect(cartNugget).toHaveClass(/is-expanded/)
            const children = cartNugget.locator('.nugget-items > .nugget')
            await expect(children).toHaveCount(3)

            // Child tests show the correct names
            await assertNormalizedText(children.nth(0).locator('.test-name'), 'should add item to cart')
            await assertNormalizedText(children.nth(1).locator('.test-name'), 'should calculate total with discount')
            await assertNormalizedText(children.nth(2).locator('.test-name'), 'should remove item from cart')
        })

        test('shows correct sort/item count', async ({ page }) => {
            await activateFirstFramework(page)

            await expect(page.locator('.sort')).toContainText('5 items sorted by Name')
        })

        test('can switch frameworks and see updated data', async ({ page }) => {
            await activateFirstFramework(page)
            await ipcResetMockHistory(page)

            // Switch to PHPUnit
            const secondFramework = page.locator('.sidebar section.scrollable .sidebar-item--framework').nth(1)
            await secondFramework.locator('.header').click()

            await assertSendCallArgs(page, 0, 'project-active-framework', 'snap-phpunit-1')
            await ipcResetMockHistory(page)

            await ipcEvent(page, 'framework-active', 'snap-phpunit-1', repositories[0])
            await nextTick(page)
            await ipcResetMockHistory(page)

            await ipcEvent(page, 'snap-phpunit-1:refreshed', suites['snap-phpunit-1'], suites['snap-phpunit-1'].length)
            await nextTick(page)

            // Verify PHPUnit framework is now displayed
            const framework = page.locator('#list .framework')
            await expect(framework.locator('.heading .name')).toContainText('PHPUnit')

            // Check suites
            const nuggets = page.locator('.framework > .children > .nugget')
            await expect(nuggets).toHaveCount(3)
            for (const nugget of await nuggets.all()) {
                await expect(nugget).toHaveClass(/status--passed/)
            }

            // Check ledger shows only passed
            const labels = page.locator('.filters .progress-breakdown .Label')
            await expect(labels).toHaveCount(1)
            await assertNormalizedText(page.locator('.filters .progress-breakdown .Label--passed'), '3 passed')

            // Actions should still be hidden
            await expect(framework.locator('.actions')).toHaveCount(0)
        })

        test('can search/filter suites by keyword', async ({ page }) => {
            await activateFirstFramework(page)
            await ipcResetMockHistory(page)

            const searchInput = page.locator('.filters.search input')
            await searchInput.fill('Cart')

            // Wait for the 300ms debounce + a small buffer
            await page.waitForTimeout(400)

            // The keyword filter IPC should have been sent
            await assertEmittedOnce(page, 'framework-filter', 'snap-jest-1', 'keyword', 'Cart')
            await ipcResetMockHistory(page)

            // Respond with only the matching suite (as the main process would)
            const cartSuite = suites['snap-jest-1'].filter(
                (s: any) => s.relative.includes('Cart'),
            )
            await ipcEvent(page, 'snap-jest-1:refreshed', cartSuite, cartSuite.length)
            await nextTick(page)

            const nuggets = page.locator('.framework > .children > .nugget')
            await expect(nuggets).toHaveCount(1)
            await expect(nuggets.nth(0)).toContainText('Cart.spec.js')
        })

        test('can collapse an expanded suite', async ({ page }) => {
            await activateFirstFramework(page)

            const nuggets = page.locator('.framework > .children > .nugget')
            const firstNugget = nuggets.nth(0)

            // Expand
            await firstNugget.locator('> .header').click()
            await ipcResetMockHistory(page)
            await ipcEvent(
                page,
                '/projects/backend/__tests__/Auth.spec.js:framework-tests',
                tests['/projects/backend/__tests__/Auth.spec.js'],
            )
            await nextTick(page)
            await expect(firstNugget).toHaveClass(/is-expanded/)

            // Collapse
            const header = firstNugget.locator('> .header')
            await header.click()
            await assertEmittedOnce(page, 'framework-toggle-child', 'snap-jest-1', ['/projects/backend/__tests__/Auth.spec.js'], false)

            await expect(firstNugget).toHaveClass(/is-collapsed/)
        })
    })

    // ---------------------------------------------------------------
    // Test activation and results panel
    // ---------------------------------------------------------------

    test.describe('Test activation and results panel', () => {
        async function activatePhpunitFramework(page: any) {
            await activateFirstFramework(page)
            await ipcResetMockHistory(page)

            const secondFramework = page.locator('.sidebar section.scrollable .sidebar-item--framework').nth(1)
            await secondFramework.locator('.header').click()
            await ipcResetMockHistory(page)

            await ipcEvent(page, 'framework-active', 'snap-phpunit-1', repositories[0])
            await nextTick(page)
            await ipcResetMockHistory(page)

            await ipcEvent(page, 'snap-phpunit-1:refreshed', suites['snap-phpunit-1'], suites['snap-phpunit-1'].length)
            await nextTick(page)
        }

        async function expandSuiteAndClickTest(
            page: any,
            suiteIndex: number,
            suitePath: string,
            testIndex: number,
        ) {
            const nuggets = page.locator('.framework > .children > .nugget')
            const suiteNugget = nuggets.nth(suiteIndex)

            // Expand the suite
            await suiteNugget.locator('> .header').click()
            await ipcResetMockHistory(page)

            await ipcEvent(
                page,
                `${suitePath}:framework-tests`,
                tests[suitePath],
            )
            await nextTick(page)

            // Click the child test to activate it
            const children = suiteNugget.locator('.nugget-items > .nugget')
            await children.nth(testIndex).locator('> .header').click()

            // Wait for the results panel to load (test-get invoke round-trip)
            await page.locator('#results .has-status').waitFor({ state: 'attached', timeout: 5000 })
        }

        test('results panel shows "No test selected" when no test is active', async ({ page }) => {
            await activateFirstFramework(page)

            const results = page.locator('#results .results')
            await expect(results).toContainText('No test selected')
        })

        test('can activate a test and show the results panel', async ({ page }) => {
            await activateFirstFramework(page)

            await expandSuiteAndClickTest(
                page,
                0,
                '/projects/backend/__tests__/Auth.spec.js',
                0,
            )

            // The child test should be marked active
            const firstChild = page.locator('.framework > .children > .nugget').nth(0)
                .locator('.nugget-items > .nugget').nth(0)
            await expect(firstChild).toHaveClass(/is-active/)

            // Results panel should show the test name
            const results = page.locator('#results .results')
            await expect(results.locator('h2.heading')).toContainText('should authenticate valid user')

            // Information tab should be available (stats present)
            const infoTab = results.locator('.tabs button', { hasText: 'Information' })
            await expect(infoTab).toBeVisible()
            await infoTab.click()

            // Verify test information table is visible with stats
            const info = results.locator('.test-information')
            await expect(info).toBeVisible()
            await expect(info).toContainText('Status')
            await expect(info).toContainText('Duration')
            await expect(info).toContainText('Assertions')
        })

        test('can activate a failed test and show its results', async ({ page }) => {
            await activateFirstFramework(page)

            await expandSuiteAndClickTest(
                page,
                1,
                '/projects/backend/__tests__/Cart.spec.js',
                1,
            )

            // Results panel should show the failed test name
            const results = page.locator('#results .results')
            await expect(results.locator('h2.heading')).toContainText('should calculate total with discount')

            // Information tab should be visible with stats
            const infoTab = results.locator('.tabs button', { hasText: 'Information' })
            await expect(infoTab).toBeVisible()
            await infoTab.click()

            const info = results.locator('.test-information')
            await expect(info).toBeVisible()
            await expect(info).toContainText('Duration')
            await expect(info).toContainText('120ms')
            await expect(info).toContainText('Assertions')
        })

        test('can navigate between tests in the same suite', async ({ page }) => {
            await activateFirstFramework(page)

            // Expand Auth.spec.js and click first test
            await expandSuiteAndClickTest(
                page,
                0,
                '/projects/backend/__tests__/Auth.spec.js',
                0,
            )

            const suiteNugget = page.locator('.framework > .children > .nugget').nth(0)
            const children = suiteNugget.locator('.nugget-items > .nugget')

            // First child should be active
            await expect(children.nth(0)).toHaveClass(/is-active/)
            await expect(page.locator('#results .results h2.heading')).toContainText('should authenticate valid user')

            // Click second child
            await children.nth(1).locator('> .header').click()
            await page.locator('#results .has-status').waitFor({ state: 'attached', timeout: 5000 })

            // Second child should now be active, first should not
            await expect(children.nth(0)).not.toHaveClass(/is-active/)
            await expect(children.nth(1)).toHaveClass(/is-active/)
            await expect(page.locator('#results .results h2.heading')).toContainText('should reject invalid credentials')
        })

        test('can activate a PHPUnit test with console data and show its results', async ({ page }) => {
            await activatePhpunitFramework(page)

            await expandSuiteAndClickTest(
                page,
                0,
                '/projects/backend/tests/Unit/ServiceTest.php',
                1,
            )

            // Results panel should show the test name
            const results = page.locator('#results .results')
            await expect(results.locator('h2.heading')).toContainText('Service dependency injection')

            // Information tab should be visible with stats
            const infoTab = results.locator('.tabs button', { hasText: 'Information' })
            await expect(infoTab).toBeVisible()
            await infoTab.click()

            const info = results.locator('.test-information')
            await expect(info).toBeVisible()
            await expect(info).toContainText('Duration')
            await expect(info).toContainText('15ms')
            await expect(info).toContainText('Assertions')
        })

        test('can activate a PHPUnit test and see results', async ({ page }) => {
            await activatePhpunitFramework(page)

            await expandSuiteAndClickTest(
                page,
                1,
                '/projects/backend/tests/Unit/RepositoryTest.php',
                0,
            )

            // Results panel should show the test name
            const results = page.locator('#results .results')
            await expect(results.locator('h2.heading')).toContainText('Find by id')

            // Information tab should be available
            const infoTab = results.locator('.tabs button', { hasText: 'Information' })
            await expect(infoTab).toBeVisible()
            await infoTab.click()

            const info = results.locator('.test-information')
            await expect(info).toBeVisible()
            await expect(info).toContainText('Duration')
            await expect(info).toContainText('Assertions')
        })

        test('can expand PHPUnit suites and see individual tests', async ({ page }) => {
            await activatePhpunitFramework(page)

            const nuggets = page.locator('.framework > .children > .nugget')
            const firstNugget = nuggets.nth(0)

            // Expand ServiceTest.php
            await firstNugget.locator('> .header').click()
            await ipcResetMockHistory(page)

            await ipcEvent(
                page,
                '/projects/backend/tests/Unit/ServiceTest.php:framework-tests',
                tests['/projects/backend/tests/Unit/ServiceTest.php'],
            )
            await nextTick(page)

            await expect(firstNugget).toHaveClass(/is-expanded/)
            const children = firstNugget.locator('.nugget-items > .nugget')
            await expect(children).toHaveCount(2)

            await assertNormalizedText(children.nth(0).locator('.test-name'), 'Service creation')
            await assertNormalizedText(children.nth(1).locator('.test-name'), 'Service dependency injection')
        })
    })
})
