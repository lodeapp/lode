import * as path from 'node:path'
import { defineConfig } from '@playwright/test'

export default defineConfig({
    testDir: path.resolve(__dirname, 'e2e'),
    outputDir: path.resolve(__dirname, 'test-results'),
    timeout: 30000,
    retries: 2,
    workers: 1,
    reporter: [
        ['list'],
        ['html', { outputFolder: path.resolve(__dirname, 'playwright-report'), open: 'never' }],
    ],
    use: {
        baseURL: 'http://localhost:9080',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },
    globalSetup: path.resolve(__dirname, 'global-setup.ts'),
    webServer: {
        command: `npx vite --config ${path.resolve(__dirname, 'vite.e2e.config.ts')}`,
        port: 9080,
        reuseExistingServer: !process.env.CI,
    },
})
