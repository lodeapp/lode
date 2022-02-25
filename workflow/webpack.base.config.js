'use strict'

const path = require('path')
const webpack = require('webpack')
const ESLintPlugin = require('eslint-webpack-plugin')
const StyleLintPlugin = require('stylelint-webpack-plugin')

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
        minimize: process.env.NODE_ENV === 'production',
        removeEmptyChunks: true,
    },
    devtool: process.env.NODE_ENV !== 'production' ? 'source-map' : false,
    plugins: [
        new ESLintPlugin({
            quiet: true
        }),
        new StyleLintPlugin({
            files: ['src/**/*.{vue,scss}']
        }),
        new webpack.DefinePlugin({
            __VUE_OPTIONS_API__: true,
            __VUE_PROD_DEVTOOLS__: false
        })
    ]
}
