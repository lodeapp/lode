'use strict'

process.env.BABEL_ENV = 'main'

const { getReplacements } = require('./app-info')

const _ = require('lodash')
const path = require('path')
const { dependencies } = require('../package.json')
const webpack = require('webpack')
const MinifyPlugin = require('babel-minify-webpack-plugin')
const PreJSPlugin = require('dotprejs/src/PreJSPlugin')

const mainConfig = {
    entry: {
        main: path.join(__dirname, '../src/main/index.ts')
    },
    externals: [
        ...Object.keys(dependencies || {})
    ],
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: 'ts-loader',
                exclude: /node_modules/,
                options: {
                    appendTsSuffixTo: [/\.vue$/]
                }
            },
            {
                test: /\.(js)$/,
                enforce: 'pre',
                exclude: /node_modules/,
                use: {
                    loader: 'eslint-loader',
                    options: {
                        formatter: require('eslint-friendly-formatter'),
                        quiet: true
                    }
                }
            },
            {
                test: /\.js$/,
                use: 'babel-loader',
                exclude: /node_modules/
            }
        ]
    },
    node: {
        __dirname: process.env.NODE_ENV !== 'production',
        __filename: process.env.NODE_ENV !== 'production'
    },
    output: {
        filename: '[name].js',
        libraryTarget: 'commonjs2',
        path: path.join(__dirname, '../dist/electron')
    },
    plugins: [
        new webpack.NoEmitOnErrorsPlugin()
    ],
    resolve: {
        alias: {
            '@main': path.join(__dirname, '../src/main'),
            '@lib': path.join(__dirname, '../src/lib')
        },
        extensions: ['.js', '.ts', '.json', '.node']
    },
    target: 'electron-main'
}

mainConfig.plugins.push(
    new webpack.DefinePlugin(Object.assign({}, getReplacements(), {
        __PROCESS_KIND__: JSON.stringify('main')
    }))
)

// Adjust mainConfig for development settings
if (process.env.NODE_ENV !== 'production') {
    mainConfig.plugins.push(
        new webpack.DefinePlugin({
            '__static': `"${path.join(__dirname, '../static').replace(/\\/g, '\\\\')}"`
        })
    )
}

// Adjust mainConfig for production settings
if (process.env.NODE_ENV === 'production') {
    Array.prototype.push.apply(mainConfig.plugins, _.compact([
        new MinifyPlugin(),
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
