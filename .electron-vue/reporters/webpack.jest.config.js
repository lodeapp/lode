'use strict'

process.env.BABEL_ENV = 'reporters'

const { getReplacements } = require('../app-info')
const replacements = getReplacements()

const path = require('path')
const webpack = require('webpack')

const MinifyPlugin = require('babel-minify-webpack-plugin')

let config = {
    entry: {
        main: path.join(__dirname, '../../src/lib/reporters/jest/index.js')
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                use: 'babel-loader',
                exclude: /node_modules/
            },
            {
                test: /\.node$/,
                use: 'node-loader'
            }
        ]
    },
    node: {
        __dirname: process.env.NODE_ENV !== 'production',
        __filename: process.env.NODE_ENV !== 'production'
    },
    output: {
        filename: 'index.js',
        libraryTarget: 'commonjs2',
        path: path.join(__dirname, '../../static/reporters/jest')
    },
        plugins: [
        new webpack.NoEmitOnErrorsPlugin()
    ],
        resolve: {
        extensions: ['.js']
    },
    target: 'node'
}

config.plugins.push(
    new webpack.DefinePlugin(replacements)
)

if (process.env.NODE_ENV === 'production') {
    config.plugins.push(
        new MinifyPlugin(),
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': '"production"'
        })
    )
}

module.exports = config
