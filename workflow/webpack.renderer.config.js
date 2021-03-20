'use strict'

process.env.BABEL_ENV = 'renderer'

const path = require('path')
const webpack = require('webpack')
const base = require('./webpack.base.config.js')
const { merge } = require('webpack-merge')
const { getReplacements } = require('./app-info')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CircularDependencyPlugin = require('circular-dependency-plugin')
const { VueLoaderPlugin } = require('vue-loader')

const rendererConfig = merge(base, {
    target: 'web',
    entry: {
        renderer: path.join(__dirname, '../src/renderer/index.js')
    },
    output: {
        libraryTarget: 'umd'
    },
    module: {
        rules: [
            {
                test: /\.scss$/,
                use: [
                    {
                        loader: 'style-loader',
                        options: { injectType: 'linkTag' }
                    },
                    {
                        loader: 'file-loader',
                        options: {
                            name: '[path][name].css'
                        }
                    },
                    'sass-loader'
                ]
            },
            {
                test: /\.css$/,
                use: [
                    {
                        loader: 'style-loader',
                        options: { injectType: 'linkTag' }
                    },
                    {
                        loader: 'file-loader',
                        options: {
                            name: '[path][name].css'
                        }
                    }
                ]
            },
            {
                test: /\.vue$/,
                use: {
                    loader: 'vue-loader',
                    options: {
                        extractCSS: true,
                        loaders: {
                            scss: 'style-loader!css-loader!sass-loader'
                        }
                    }
                }
            }
        ]
    },
    resolve: {
        fallback: {
            'path': require.resolve('path-browserify'),
            'stream': require.resolve('stream-browserify')
        }
    },
    plugins: [
        new webpack.ProvidePlugin({
            process: 'process/browser'
        }),
        new webpack.DefinePlugin(Object.assign({}, getReplacements(), {
            __PROCESS_KIND__: JSON.stringify('renderer')
        })),
        new VueLoaderPlugin(),
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: path.resolve(__dirname, '../src/index.ejs'),
            minify: {
                collapseWhitespace: true,
                removeAttributeQuotes: true,
                removeComments: true
            },
            nodeModules: false
        }),
        new webpack.NoEmitOnErrorsPlugin(),
        new CircularDependencyPlugin({
            exclude: /node_modules/,
            failOnError: true,
            allowAsyncCycles: false,
            cwd: process.cwd()
        })
    ]
})

if (process.env.NODE_ENV !== 'production' || process.env.IS_DEV) {
    rendererConfig.plugins.push(
        new webpack.DefinePlugin({
            '__static': `"${path.join(__dirname, '../static').replace(/\\/g, '\\\\')}"`,
            'process.env': '{}'
        })
    )
}

if (process.env.NODE_ENV === 'production') {
    rendererConfig.plugins.push(
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: path.join(__dirname, '../static'),
                    to: path.join(__dirname, '../dist/static'),
                    globOptions: {
                        ignore: ['.*']
                    }
                }
            ]
        }),
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': '"production"'
        }),
        new webpack.LoaderOptionsPlugin({
            minimize: true
        })
    )
}

module.exports = rendererConfig
