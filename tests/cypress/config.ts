import * as Path from 'node:path'
import { defineConfig } from 'cypress'
import { build } from 'esbuild'

export default defineConfig({
    e2e: {
        projectId: '6ki1wz',
        baseUrl: 'http://localhost:9080',
        specPattern: 'tests/cypress/e2e/**/*.{js,ts}',
        fixturesFolder: Path.resolve('../fixtures'),
        screenshotsFolder: Path.resolve('screenshots'),
        supportFile: Path.resolve('support/index.js'),
        videosFolder: Path.resolve('videos'),
        videoCompression: 0,
        video: true,
        retries: {
            runMode: 2,
            openMode: 0
        },
        scrollBehavior: false,
        waitForAnimations: false,
        setupNodeEvents (on, config) {
            on('file:preprocessor', async (file) => {
                const outfile = file.outputPath
                await build({
                    entryPoints: [file.filePath],
                    outfile,
                    bundle: true,
                    platform: 'node',
                    format: 'cjs',
                    sourcemap: true,
                    define: {
                        'process.env.NODE_ENV': '"development"'
                    },
                    resolveExtensions: ['.ts', '.js'],
                    alias: {
                        '@preload': Path.join(__dirname, '../../src/preload'),
                        'electron': Path.join(__dirname, '../mocks/electron.js')
                    }
                })
                return outfile
            })
        }
    }
})
