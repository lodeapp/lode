'use strict'

const Path = require('path')
const { spawn } = require('child_process')
const chalk = require('chalk')
const electron = require('electron')
const webpack = require('webpack')
const WebpackDevServer = require('webpack-dev-server')
const webpackHotMiddleware = require('webpack-hot-middleware')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin

const mainConfig = require('./webpack.main.config')
const rendererConfig = require('./webpack.renderer.config')

let electronProcess = null
let manualRestart = false
let hotMiddleware

function logStats (proc, data) {
    let log = ''

    log += chalk.yellow.bold(`┏ ${proc} Process ${new Array((19 - proc.length) + 1).join('-')}`)
    log += '\n\n'

    if (typeof data === 'object') {
        data.toString({
            colors: true,
            chunks: false
        }).split(/\r?\n/).forEach(line => {
            log += '  ' + line + '\n'
        })
    } else {
        log += `  ${data}\n`
    }

    log += '\n' + chalk.yellow.bold(`┗ ${new Array(28 + 1).join('-')}`) + '\n'

    console.log(log)
}

function startRenderer () {
    return new Promise((resolve, reject) => {
        rendererConfig.entry.renderer = [Path.join(__dirname, 'dev-client')].concat(rendererConfig.entry.renderer)
        rendererConfig.mode = 'development'
        const compiler = webpack(rendererConfig)
        hotMiddleware = webpackHotMiddleware(compiler, {
            log: false,
            heartbeat: 2500
        })

        compiler.hooks.compilation.tap('compilation', compilation => {
            compilation.hooks.htmlWebpackPluginAfterEmit.tapAsync('html-webpack-plugin-after-emit', (data, cb) => {
                hotMiddleware.publish({ action: 'reload' })
                cb()
            })
        })

        compiler.hooks.done.tap('done', stats => {
            logStats('Renderer', stats)
        })

        const server = new WebpackDevServer(
            compiler,
            {
                contentBase: Path.join(__dirname, '../'),
                quiet: true,
                before (app, ctx) {
                    app.use(hotMiddleware)
                    ctx.middleware.waitUntilValid(() => {
                        resolve()
                    })
                }
            }
        )

        server.listen(9080)
    })
}

function startMain () {
    return new Promise((resolve, reject) => {
        mainConfig.entry.main = [Path.join(__dirname, '../src/main/index.dev.ts')].concat(mainConfig.entry.main)
        mainConfig.mode = 'development'
        const compiler = webpack(mainConfig)

        compiler.hooks.watchRun.tapAsync('watch-run', (compilation, done) => {
            logStats('Main', chalk.white.bold('compiling...'))
            hotMiddleware.publish({ action: 'compiling' })
            done()
        })

        compiler.watch({}, (err, stats) => {
            if (err) {
                console.log(err)
                return
            }

            logStats('Main', stats)

            if (electronProcess && electronProcess.kill) {
                manualRestart = true
                process.kill(electronProcess.pid)
                electronProcess = null
                startElectron()

                setTimeout(() => {
                    manualRestart = false
                }, 5000)
            }

            resolve()
        })
    })
}

function startElectron () {
    if (process.argv[2] === 'migrate') {
        electronProcess = spawn(electron, [
            '--inspect=5858',
            Path.join(__dirname, '../dist/electron/main.js'),
            'migrate',
            process.argv[3] || 'up'
        ])
    } else {
        electronProcess = spawn(electron, ['--inspect=5858', Path.join(__dirname, '../dist/electron/main.js')])
    }

    electronProcess.stdout.on('data', data => {
        electronLog(data)
    })
    electronProcess.stderr.on('data', data => {
        electronLog(data, 'red')
    })

    electronProcess.on('close', () => {
        if (!manualRestart) {
            process.exit()
        }
    })
}

function electronLog (data, color) {
    console.log(color ? chalk[color](data.toString()) : data.toString())
}

function init () {
    // Analyze bundle (i.e. yarn size / yarn size:main)
    if (process.env.SIZE) {
        const config = process.env.PROCESS === 'main' ? mainConfig : rendererConfig
        config.plugins.push(new BundleAnalyzerPlugin())
        config.mode = 'production'
        webpack(config, (err, stats) => {
            if (err || stats.hasErrors()) {
                console.error(err)
                return
            }
        })
        return
    }

    Promise.all([startRenderer(), startMain()])
        .then(() => {
            startElectron()
        })
        .catch(err => {
            console.error(err)
        })
}

init()
