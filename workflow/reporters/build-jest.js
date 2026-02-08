'use strict'

const path = require('node:path')
const { build } = require('esbuild')
const { getReplacements } = require('../app-info')

const replacements = getReplacements()

// Convert replacement values to strings for esbuild's define
// esbuild requires all values to be strings; filter out undefined values
const define = {}
for (const [key, value] of Object.entries(replacements)) {
    if (value === undefined) {
        continue
    }
    define[key] = typeof value === 'string' ? value : JSON.stringify(value)
}

if (process.env.NODE_ENV === 'production') {
    define['process.env.NODE_ENV'] = '"production"'
}

build({
    entryPoints: [path.resolve(__dirname, '../../src/lib/reporters/jest/index.js')],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: path.resolve(__dirname, '../../static/reporters/jest/index.js'),
    define,
    minify: process.env.NODE_ENV === 'production',
}).then(() => {
    console.log('Jest reporter built successfully')
}).catch((err) => {
    console.error('Failed to build Jest reporter:', err)
    process.exit(1)
})
