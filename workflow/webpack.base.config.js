'use strict'

const path = require('path')
const TerserWebpackPlugin = require('terser-webpack-plugin')

module.exports = {
    output: {
        filename: '[name].js',
        libraryTarget: 'commonjs2',
        path: path.join(__dirname, '../dist')
    },
    resolve: {
        alias: {
            '@': path.join(__dirname, '../src/renderer'),
            '@lib': path.join(__dirname, '../src/lib'),
            '@main': path.join(__dirname, '../src/main'),
            'vue$': 'vue/dist/vue.esm.js'
        },
        extensions: ['.js', '.ts', '.vue', '.json', '.css']
    },
    module: {
        rules: [
            {
                test: /\.ts?$/,
                loader: 'ts-loader',
                exclude: /node_modules/
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
    optimization: {
        minimizer: [new TerserWebpackPlugin()]
    },
    devtool: process.env.NODE_ENV !== 'production' ? 'source-map' : false
}
