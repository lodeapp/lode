'use strict'

const { exec } = require('child_process')
let callbackId = null

const teardown = (code = 0) => {
    if (callbackId) {
        try {
            // Try to kill child process, but don't
            // throw if it no longer exists
            process.kill(-callbackId)
        } catch (_) {}
    }
    process.exit(code)
}

if (process.platform === 'win32') {
    const rl = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    })

    rl.on('SIGINT', () => {
        process.emit('SIGINT')
    })
}

process.on('SIGINT', () => {
    teardown()
})

const startRenderer = require('./runners').startRenderer
startRenderer().then(() => {
    const callback = exec(process.argv[2] === 'open'
        ? 'cypress open'
        : 'cypress run -b electron'
    )
    callbackId = callback.pid
    callback.stdout.setEncoding('utf8')
    callback.stderr.setEncoding('utf8')
    callback.stdout.pipe(process.stdout)
    callback.stderr.pipe(process.stderr)
    callback.on('error', (...args) => {
        teardown(...args)
    })
    callback.on('close', (...args) => {
        teardown(...args)
    })
})
