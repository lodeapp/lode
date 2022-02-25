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
                test: /\.(sass|scss|css)$/,
                use: [
                    'style-loader',
                    'css-loader',
                    'sass-loader'
                ]
            },
            {
                test: /\.(png|svg|jpg|jpeg|gif)$/i,
                type: 'asset/resource'
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
        },
        alias: {
            // Patch Primer CSS images not being included in the package.
            '/images/spinners/octocat-spinner-16px.gif': path.join(__dirname, '../src/styles/images/error.png'),
            '/images/modules/ajax/success.png': path.join(__dirname, '../src/styles/images/error@2x.png'),
            '/images/modules/ajax/error.png': path.join(__dirname, '../src/styles/images/octocat-spinner-16px.gif'),
            '/images/spinners/octocat-spinner-32.gif': path.join(__dirname, '../src/styles/images/octocat-spinner-32-EAF2F5.gif'),
            '/images/modules/ajax/success@2x.png': path.join(__dirname, '../src/styles/images/octocat-spinner-32.gif'),
            '/images/modules/ajax/error@2x.png': path.join(__dirname, '../src/styles/images/success.png'),
            '/images/spinners/octocat-spinner-32-EAF2F5.gif': path.join(__dirname, '../src/styles/images/success@2x.png')
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
