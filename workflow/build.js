'use strict'

process.env.NODE_ENV = 'production'

const del = require('del')
const webpack = require('webpack')

const mainConfig = require('./webpack.main.config')
const preloadConfig = require('./webpack.preload.config')
const rendererConfig = require('./webpack.renderer.config')

build()

function build () {
    del.sync(['dist/*', '!.gitkeep'])
    pack(mainConfig, 'main')
    pack(preloadConfig, 'preload')
    pack(rendererConfig, 'renderer')
}

function pack (config, input) {
    return new Promise((resolve, reject) => {
        config.mode = process.env.NODE_ENV === 'development' ? 'development' : 'production'
        config.plugins = [...config.plugins, new webpack.ProgressPlugin({
            handler (percentage, msg) {
                console.log(`${input}/${msg}: ${(percentage * 100).toFixed()}%`)
            }
        })]
        webpack(config, (err, stats) => {
            if (err) reject(err.stack || err)
            else if (stats.hasErrors()) {
                let err = ''

                stats.toString({
                    chunks: false,
                    colors: true
                })
                    .split(/\r?\n/)
                    .forEach(line => {
                        err += `    ${line}\n`
                    })

                reject(err)
            } else {
                resolve(stats.toString({
                    chunks: false,
                    colors: true
                }))
            }
        })
    })
}
