import { resolve } from 'path'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            '@': resolve('src/renderer'),
            '@lib': resolve('src/lib'),
            '@main': resolve('src/main')
        }
    },
    define: {
        __DEV__: true,
        __SILENT__: true,
        __WIN32__: process.platform === 'win32',
        __DARWIN__: process.platform === 'darwin',
        __LINUX__: process.platform === 'linux'
    },
    test: {
        globals: true,
        clearMocks: true,
        setupFiles: ['./tests/mocks/setup.js'],
        globalSetup: ['./tests/setup.js'],
        include: ['tests/**/*.spec.{js,ts}']
    }
})
