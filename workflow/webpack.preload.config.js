'use strict'

process.env.BABEL_ENV = 'preload'

const base = require('./webpack.base.config.js')
const { merge } = require('webpack-merge')
const path = require('path')

const preloadConfig = merge(base, {
    target: 'electron-preload',
    entry: {
        preload: path.join(__dirname, '../src/preload/index.ts')
    }
})

module.exports = preloadConfig
