'use strict'

process.env.BABEL_ENV = 'preload'

const base = require('./webpack.base.config.js')
const path = require('path')

module.exports = {
    ...base,
    target: 'electron-preload',
    entry: {
        preload: path.join(__dirname, '../src/preload/index.js')
    }
}
