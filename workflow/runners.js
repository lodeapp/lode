'use strict'

const Path = require('path')
const { spawn } = require('child_process')
const chalk = require('chalk')
const electron = require('electron')
const webpack = require('webpack')
const WebpackDevServer = require('webpack-dev-server')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin

let electronProcess = null
let manualRestart = false

const logStats = (proc, data) => {
    let log = ''

    log += '\n'
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

    log += '\n' + chalk.yellow.bold(`┗ ${new Array(28 + 1).join('-')}`)

    console.log(log)
}

const startRenderer = () => {
    return new Promise((resolve, reject) => {
        const rendererConfig = require('./webpack.renderer.config')
        rendererConfig.mode = 'development'
        const compiler = webpack(rendererConfig)

        compiler.hooks.done.tap('done', stats => {
            logStats('Renderer', stats)
        })

        const server = new WebpackDevServer(
            {
                port: 9080,
                static: {
                    directory: Path.join(__dirname, '../')
                },
                onBeforeSetupMiddleware (devServer) {
                    devServer.middleware.waitUntilValid(() => {
                        resolve()
                    })
                }
            },
            compiler
        )

        server.start()
    })
}

const start = (name, config) => {
    return new Promise((resolve, reject) => {
        config.mode = 'development'
        const compiler = webpack(config)

        compiler.hooks.watchRun.tapAsync('watch-run', (compilation, done) => {
            logStats(name, chalk.white.bold('compiling...'))
            done()
        })

        compiler.watch({}, (err, stats) => {
            if (err) {
                console.log(err)
                return
            }

            logStats(name, stats)

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

const startPreload = () => {
    return start('Preload', require('./webpack.preload.config'))
}

const startMain = () => {
    const mainConfig = require('./webpack.main.config')
    mainConfig.entry.main = [Path.join(__dirname, '../src/main/index.dev.ts')].concat(mainConfig.entry.main)
    return start('Main', mainConfig)
}

const startElectron = () => {
    electronProcess = spawn(electron, ['--trace-warnings', '--inspect=5858', Path.join(__dirname, '../dist/main.js')])

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

const electronLog = (data, color) => {
    console.log(color ? chalk[color](data.toString()) : data.toString())
}

const init = () => {
    // Analyze bundle (i.e. yarn size / yarn size:main)
    if (process.env.SIZE) {
        const config = process.env.PROCESS === 'main'
            ? require('./webpack.main.config')
            : require('./webpack.renderer.config')
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

    Promise.all([startRenderer(), startPreload(), startMain()])
        .then(() => {
            startElectron()
        })
        .catch(err => {
            console.error(err)
        })
}

module.exports = {
    logStats,
    startRenderer,
    start,
    startPreload,
    startMain,
    startElectron,
    electronLog,
    init
}
