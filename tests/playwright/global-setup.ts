import { build } from 'esbuild'
import * as path from 'path'

export default async function globalSetup() {
    await build({
        entryPoints: [path.resolve(__dirname, 'init-entry.ts')],
        outfile: path.resolve(__dirname, '.init-bundle.js'),
        bundle: true,
        platform: 'browser',
        format: 'iife',
        sourcemap: false,
        define: {
            'process.env.NODE_ENV': '"development"',
        },
        resolveExtensions: ['.ts', '.js'],
        alias: {
            'electron': path.resolve(__dirname, '../mocks/electron.js'),
        },
    })
}
