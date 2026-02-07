'use strict'

const Path = require('node:path')
const { exec } = require('child_process')
const { createServer } = require('vite')
let callbackId = null
let server = null

const teardown = (code = 0) => {
    if (callbackId) {
        try {
            // Try to kill child process, but don't
            // throw if it no longer exists
            process.kill(-callbackId)
        } catch (_) {}
    }
    if (server) {
        server.close()
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

const startRenderer = async () => {
    server = await createServer({
        root: Path.resolve(__dirname, '../src/renderer'),
        server: {
            port: 9080
        },
        resolve: {
            alias: {
                '@': Path.resolve(__dirname, '../src/renderer'),
                '@lib': Path.resolve(__dirname, '../src/lib'),
                '@main': Path.resolve(__dirname, '../src/main')
            }
        }
    })

    await server.listen()
    console.log('Renderer dev server ready on http://localhost:9080')
}

startRenderer().then(() => {
    const callback = exec(
        process.argv[2] === 'open'
            ? `cypress open ${process.argv.slice(3).join(' ')} --config-file ${Path.resolve(__dirname, '../tests/cypress/config.ts')}`
            : `cypress run -b electron ${process.argv.slice(3).join(' ')} --config-file ${Path.resolve(__dirname, '../tests/cypress/config.ts')}`,
        {
            env: {
                ...process.env,
                FORCE_COLOR: 3
            }
        }
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
