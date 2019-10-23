'use strict'

process.env.NODE_ENV = 'production'

const del = require('del')
const webpack = require('webpack')

const mainConfig = require('./webpack.main.config')
const rendererConfig = require('./webpack.renderer.config')

build()

function build () {
    del.sync(['dist/electron/*', '!.gitkeep'])
    pack(mainConfig)
    pack(rendererConfig)
}

function pack (config) {
    return new Promise((resolve, reject) => {
        config.mode = 'production'
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
