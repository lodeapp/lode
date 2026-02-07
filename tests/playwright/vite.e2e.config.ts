import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

const projectRoot = resolve(__dirname, '../..')
const s = JSON.stringify

export default defineConfig({
    root: resolve(projectRoot, 'src/renderer'),
    resolve: {
        alias: {
            '@': resolve(projectRoot, 'src/renderer'),
            '@lib': resolve(projectRoot, 'src/lib'),
            '@main': resolve(projectRoot, 'src/main'),
            'path': 'path-browserify',
        },
    },
    define: {
        '__DARWIN__': process.platform === 'darwin',
        '__WIN32__': process.platform === 'win32',
        '__LINUX__': process.platform === 'linux',
        '__DEV__': true,
        '__LOGGER__': false,
        'process.platform': s(process.platform),
        'process.env.NODE_ENV': s('development'),
        '__VUE_OPTIONS_API__': 'true',
        '__VUE_PROD_DEVTOOLS__': 'false',
        '__static': s(resolve(projectRoot, 'static')),
        '__CRASH_URL__': s(''),
    },
    plugins: [
        {
            name: 'resolve-node-builtins',
            enforce: 'pre',
            resolveId(source) {
                if (source === 'node:path') {
                    return this.resolve('path')
                }
            },
        },
        vue(),
    ],
    publicDir: resolve(projectRoot, 'static'),
    css: {
        preprocessorOptions: {
            scss: {
                silenceDeprecations: ['import', 'global-builtin', 'if-function'],
                loadPaths: [projectRoot],
            },
        },
    },
    server: {
        port: 9080,
    },
})
