import { formatLogMessage } from './format'
import { log } from './index'

const g = globalThis as any

g.log = {
    error(message: string | object, error?: Error) {
        log('error', `[main]: ${formatLogMessage(message, error)}`)
    },
    warn(message: string | object, error?: Error) {
        log('warn', `[main]: ${formatLogMessage(message, error)}`)
    },
    info(message: string | object, error?: Error) {
        log('info', `[main]: ${formatLogMessage(message, error)}`)
    },
    debug(message: string | object, error?: Error) {
        log('debug', `[main]: ${formatLogMessage(message, error)}`)
    },
} as ILogger
