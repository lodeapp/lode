'use strict'

const path = require('path')
const webpack = require('webpack')
const TerserWebpackPlugin = require('terser-webpack-plugin')
const ESLintPlugin = require('eslint-webpack-plugin')

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
            'vue$': 'vue/dist/vue.esm-bundler.js'
        },
        extensions: ['.js', '.ts', '.vue', '.json', '.css']
    },
    module: {
        rules: [
            {
                test: /\.ts?$/,
                loader: 'ts-loader',
                options: {
                    appendTsSuffixTo: [/\.vue$/]
                },
                exclude: /node_modules/
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
    devtool: process.env.NODE_ENV !== 'production' ? 'source-map' : false,
    plugins: [
        new ESLintPlugin(),
        new webpack.DefinePlugin({
            __VUE_OPTIONS_API__: true,
            __VUE_PROD_DEVTOOLS__: false
        })
    ]
}
