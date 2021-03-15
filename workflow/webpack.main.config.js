'use strict'

process.env.BABEL_ENV = 'main'

const { getReplacements } = require('./app-info')

const base = require('./webpack.base.config.js')
const _ = require('lodash')
const path = require('path')
const { dependencies } = require('../package.json')
const webpack = require('webpack')
const PreJSPlugin = require('dotprejs/src/PreJSPlugin')

const mainConfig = {
    ...base,
    target: 'electron-main',
    entry: {
        main: path.join(__dirname, '../src/main/index.ts')
    },
    externals: [
        ...Object.keys(dependencies || {})
    ],
    node: {
        __dirname: process.env.NODE_ENV !== 'production',
        __filename: process.env.NODE_ENV !== 'production'
    },
    plugins: [
        new webpack.NoEmitOnErrorsPlugin(),
        new webpack.DefinePlugin(Object.assign({}, getReplacements(), {
            __PROCESS_KIND__: JSON.stringify('main')
        }))
    ]
}

if (process.env.NODE_ENV !== 'production' || process.env.IS_DEV) {
    mainConfig.plugins.push(
        new webpack.DefinePlugin({
            '__static': `"${path.join(__dirname, '../static').replace(/\\/g, '\\\\')}"`
        })
    )
}

if (process.env.NODE_ENV === 'production') {
    Array.prototype.push.apply(mainConfig.plugins, _.compact([
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': '"production"'
        }),
        ['darwin', 'win32'].indexOf(process.platform) > -1
            ? new PreJSPlugin({
                assets: ['main.js'],
                runtime: require('electron')
            })
            : null
    ]))
}

module.exports = mainConfig
