import { ipcRenderer } from 'electron'
import { LogLevel } from './levels'
import { formatLogMessage } from './format'

const g = global as any

function log (level: LogLevel, message: string | object, error?: Error) {
    ipcRenderer.send('log', level, '[preload]: ' + formatLogMessage(message, error))
}

g.log = {
    error (message: string | object, error?: Error) {
        log('error', message, error)
        console.error(formatLogMessage(message, error))
    },
    warn (message: string | object, error?: Error) {
        log('warn', message, error)
        console.warn(formatLogMessage(message, error))
    },
    info (message: string | object, error?: Error) {
        log('info', message, error)
        console.info(formatLogMessage(message, error))
    },
    debug (message: string | object, error?: Error) {
        log('debug', message, error)
        console.debug(formatLogMessage(message, error))
    }
} as ILogger
