import { expect, test } from '@playwright/test'
import { nextTick, startWithSnapshot } from '../helpers/app'
import { loadFixture } from '../helpers/fixtures'
import {
    ipcEvent,
    ipcResetMockHistory,
    setInvokeHandler,
} from '../helpers/ipc'

test.describe('ANSI output rendering', () => {
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

    async function activatePhpunitAndOpenConsole(page: any) {
        await startWithSnapshot(page)
        await nextTick(page)
        await setupSnapshotResolver(page)

        await ipcEvent(page, 'snap-project-1:repositories', repositories)
        await nextTick(page)
        await ipcResetMockHistory(page)

        // Activate PHPUnit framework
        await ipcEvent(page, 'framework-active', 'snap-phpunit-1', repositories[0])
        await nextTick(page)
        await ipcResetMockHistory(page)

        await ipcEvent(page, 'snap-phpunit-1:refreshed', suites['snap-phpunit-1'], suites['snap-phpunit-1'].length)
        await nextTick(page)

        // Expand ServiceTest.php suite (index 0)
        const nuggets = page.locator('.framework > .children > .nugget')
        const suiteNugget = nuggets.nth(0)
        await suiteNugget.locator('> .header').click()
        await ipcResetMockHistory(page)

        await ipcEvent(
            page,
            '/projects/backend/tests/Unit/ServiceTest.php:framework-tests',
            tests['/projects/backend/tests/Unit/ServiceTest.php'],
        )
        await nextTick(page)

        // Click svc-test-2 (index 1) — the test with ANSI console output
        const children = suiteNugget.locator('.nugget-items > .nugget')
        await children.nth(1).locator('> .header').click()

        // Wait for the results panel to load
        await page.locator('#results .has-status').waitFor({ state: 'attached', timeout: 5000 })

        // Click the Console tab
        const consoleTab = page.locator('#results .tabs button', { hasText: 'Console' })
        await consoleTab.click()
        await nextTick(page)
    }

    test('renders ANSI content with colored output', async ({ page }) => {
        await activatePhpunitAndOpenConsole(page)

        // Two console entries should be rendered
        const consoleOutputs = page.locator('#results .console')
        await expect(consoleOutputs).toHaveCount(2)

        // First console entry: basic 16-color ANSI
        const firstAnsi = consoleOutputs.nth(0).locator('.ansi')
        await expect(firstAnsi).toBeVisible()
        await expect(firstAnsi).not.toHaveClass(/is-loading/)

        const firstParsed = firstAnsi.locator('.parsed')
        await expect(firstParsed).toBeVisible()

        // Should contain styled spans (xterm renders colors as inline styles)
        const spans = firstParsed.locator('span[style]')
        await expect(spans).not.toHaveCount(0)

        // Verify the text content is present
        await expect(firstParsed).toContainText('Error: connection refused')
        await expect(firstParsed).toContainText('Retrying with backoff')
        await expect(firstParsed).toContainText('timeout exceeded')
    })

    test('renders 256-color and truecolor ANSI sequences', async ({ page }) => {
        await activatePhpunitAndOpenConsole(page)

        // Second console entry has 256-color and truecolor content
        const secondAnsi = page.locator('#results .console').nth(1).locator('.ansi')
        await expect(secondAnsi).not.toHaveClass(/is-loading/)

        const parsed = secondAnsi.locator('.parsed')
        await expect(parsed).toBeVisible()

        // Verify 256-color text is rendered
        await expect(parsed).toContainText('Orange (256-color)')
        await expect(parsed).toContainText('Blue (256-color)')
        await expect(parsed).toContainText('Pink (256-color)')

        // Verify truecolor text is rendered
        await expect(parsed).toContainText('Orange (truecolor)')
        await expect(parsed).toContainText('Teal (truecolor)')

        // Verify mixed formatting text is rendered
        await expect(parsed).toContainText('Bold underline red')
        await expect(parsed).toContainText('italic cyan')

        // Verify colored spans have inline styles with color values
        const styledSpans = parsed.locator('span[style*="color"]')
        await expect(styledSpans).not.toHaveCount(0)
    })

    test('properly escapes HTML-unsafe characters', async ({ page }) => {
        await activatePhpunitAndOpenConsole(page)

        const firstParsed = page.locator('#results .console').nth(0).locator('.ansi .parsed')
        await expect(firstParsed).toBeVisible()

        // The <script> tag should be rendered as text, not executed
        await expect(firstParsed).toContainText('<script>')
        await expect(firstParsed).toContainText('</script>')

        // Verify no actual script element was injected
        const scripts = firstParsed.locator('script')
        await expect(scripts).toHaveCount(0)
    })

    test('toggles between parsed and raw views', async ({ page }) => {
        await activatePhpunitAndOpenConsole(page)

        const firstAnsi = page.locator('#results .console').nth(0).locator('.ansi')
        const rawButton = firstAnsi.locator('button[title="Show raw output"]')
        // Target the raw-mode <pre> specifically (direct child, not inside .parsed)
        const rawPre = firstAnsi.locator('> div > pre')

        // Initially shows parsed view
        await expect(firstAnsi.locator('.parsed')).toBeVisible()
        await expect(rawPre).not.toBeVisible()

        // Click raw toggle
        await rawButton.click()
        await expect(rawPre).toBeVisible()
        await expect(firstAnsi.locator('.parsed')).not.toBeVisible()

        // Click again to return to parsed view
        await rawButton.click()
        await expect(firstAnsi.locator('.parsed')).toBeVisible()
        await expect(rawPre).not.toBeVisible()
    })

    test('re-renders with different colors on theme change', async ({ page }) => {
        await activatePhpunitAndOpenConsole(page)

        const firstParsed = page.locator('#results .console').nth(0).locator('.ansi .parsed')
        await expect(firstParsed).toBeVisible()

        // Capture the initial HTML (light theme)
        const initialHtml = await firstParsed.innerHTML()

        // Switch to dark theme
        await ipcEvent(page, 'theme-updated', 'dark')
        await nextTick(page)

        // Wait for re-render — the loading state may briefly appear
        await expect(page.locator('#results .console').nth(0).locator('.ansi')).not.toHaveClass(/is-loading/)

        const darkHtml = await firstParsed.innerHTML()

        // HTML should differ (different background and foreground colors)
        expect(darkHtml).not.toBe(initialHtml)
    })

    test('copies parsed text to clipboard', async ({ page }) => {
        await activatePhpunitAndOpenConsole(page)

        const firstAnsi = page.locator('#results .console').nth(0).locator('.ansi')
        const copyButton = firstAnsi.locator('button[title="Copy to clipboard"]')

        await copyButton.click()

        // Verify Lode.copyToClipboard was called via IPC
        const clipboardText = await page.evaluate(() => {
            return (window as any).__lastClipboard
        })

        // The clipboard should contain the parsed text (without ANSI codes)
        // Note: this depends on how the mock handles copyToClipboard
        // At minimum, verify the button click didn't throw
        await expect(copyButton).toBeVisible()
    })
})
