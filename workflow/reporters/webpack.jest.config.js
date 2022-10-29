'use strict'

process.env.BABEL_ENV = 'reporters'

const { getReplacements } = require('../app-info')
const replacements = getReplacements()

const path = require('path')
const webpack = require('webpack')

const config = {
    target: 'node',
    entry: {
        main: path.join(__dirname, '../../src/lib/reporters/jest/index.js')
    },
    output: {
        filename: 'index.js',
        libraryTarget: 'commonjs2',
        path: path.join(__dirname, '../../static/reporters/jest')
    },
    resolve: {
        extensions: ['.js']
    },
    module: {
        rules: [
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
    plugins: [
        new webpack.NoEmitOnErrorsPlugin(),
        new webpack.DefinePlugin(replacements)
    ],
    optimization: {
        minimize: process.env.NODE_ENV === 'production'
    },
}

if (process.env.NODE_ENV === 'production') {
    config.plugins.push(
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': '"production"'
        })
    )
}

module.exports = config
