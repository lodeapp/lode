import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'

const s = JSON.stringify

// Dev-only Vite plugin: injects a module script before the main entry that
// connects to the standalone Vue DevTools server (port 8098). The script runs
// before createApp() thanks to module execution order, ensuring the devtools
// hooks are in place. If the server isn't running, it skips silently.
function vueDevToolsPlugin () {
    const virtualId = '\0vue-devtools-init'
    return {
        name: 'vue-devtools',
        resolveId (id: string) {
            if (id === '/@vue-devtools-init.js') return virtualId
        },
        load (id: string) {
            if (id === virtualId) {
                return [
                    'try {',
                    '  await fetch("http://localhost:8098", { mode: "no-cors" })',
                    '  const { devtools } = await import("@vue/devtools")',
                    '  devtools.connect("localhost", 8098)',
                    '  console.info("[Vue DevTools] Connected to standalone DevTools on port 8098.")',
                    '} catch {',
                    '  console.info("[Vue DevTools] Standalone server not detected on port 8098. To enable Vue DevTools, run \\`npm run devtools\\` in a separate terminal before starting the app.")',
                    '}',
                ].join('\n')
            }
        },
        transformIndexHtml () {
            return [{
                tag: 'script',
                attrs: { type: 'module', src: '/@vue-devtools-init.js' },
                injectTo: 'head-prepend' as const,
            }]
        },
    }
}

function getDefine () {
    return {
        __DARWIN__: process.platform === 'darwin',
        __WIN32__: process.platform === 'win32',
        __LINUX__: process.platform === 'linux',
        __DEV__: !!(process.env.IS_DEV) || false,
        __LOGGER__: process.env.LOGGER !== 'false',
        'process.platform': s(process.platform),
        'process.env.NODE_ENV': s(process.env.NODE_ENV || 'development'),
        'process.env.TEST_ENV': s(process.env.TEST_ENV),
        __CRASH_URL__: s('https://71e593620d21420fb864d3fe667d8ce6@sentry.io/1476972'),
        __ANALYTICS_ID__: s('UA-103701546-4')
    }
}

function getStaticDefine () {
    if (process.env.NODE_ENV !== 'production' || process.env.IS_DEV) {
        return {
            __static: s(resolve(__dirname, 'static'))
        }
    }
    return {}
}

export default defineConfig({
    main: {
        plugins: [externalizeDepsPlugin()],
        resolve: {
            alias: {
                '@lib': resolve('src/lib'),
                '@main': resolve('src/main')
            }
        },
        define: {
            ...getDefine(),
            ...getStaticDefine(),
            __PROCESS_KIND__: s('main')
        },
        build: {
            outDir: 'dist',
            lib: {
                entry: resolve(__dirname, 'src/main/index.ts')
            },
            rollupOptions: {
                output: {
                    entryFileNames: 'main.js'
                }
            }
        }
    },
    preload: {
        plugins: [externalizeDepsPlugin()],
        resolve: {
            alias: {
                '@lib': resolve('src/lib')
            }
        },
        define: {
            ...getDefine(),
            __PROCESS_KIND__: s('preload')
        },
        build: {
            outDir: 'dist',
            emptyOutDir: false,
            lib: {
                entry: resolve(__dirname, 'src/preload/index.ts')
            },
            rollupOptions: {
                output: {
                    entryFileNames: 'preload.js'
                }
            }
        }
    },
    renderer: {
        root: resolve('src/renderer'),
        resolve: {
            alias: {
                '@': resolve('src/renderer'),
                '@lib': resolve('src/lib'),
                '@main': resolve('src/main'),
                'path': 'path-browserify',
                'node:path': 'path-browserify',
                // Patch Primer CSS images not being included in the package.
                '/images/spinners/octocat-spinner-16px.gif': resolve('src/styles/images/error.png'),
                '/images/modules/ajax/success.png': resolve('src/styles/images/error@2x.png'),
                '/images/modules/ajax/error.png': resolve('src/styles/images/octocat-spinner-16px.gif'),
                '/images/spinners/octocat-spinner-32.gif': resolve('src/styles/images/octocat-spinner-32-EAF2F5.gif'),
                '/images/modules/ajax/success@2x.png': resolve('src/styles/images/octocat-spinner-32.gif'),
                '/images/modules/ajax/error@2x.png': resolve('src/styles/images/success.png'),
                '/images/spinners/octocat-spinner-32-EAF2F5.gif': resolve('src/styles/images/success@2x.png')
            }
        },
        define: {
            ...getDefine(),
            ...getStaticDefine(),
            __PROCESS_KIND__: s('renderer'),
            __VUE_OPTIONS_API__: true,
            __VUE_PROD_DEVTOOLS__: false
        },
        plugins: [
            vue(),
            process.env.IS_DEV ? vueDevToolsPlugin() : null,
        ].filter(Boolean),
        publicDir: resolve('static'),
        css: {
            preprocessorOptions: {
                scss: {
                    silenceDeprecations: ['import', 'global-builtin', 'if-function'],
                    loadPaths: [resolve(__dirname)]
                }
            }
        },
        optimizeDeps: {
            include: process.env.IS_DEV ? ['@vue/devtools'] : [],
        },
        server: {
            port: 9080
        },
        build: {
            outDir: resolve('dist'),
            emptyOutDir: false,
            rollupOptions: {
                input: resolve('src/renderer/index.html')
            }
        }
    }
})
