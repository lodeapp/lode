import { log } from './index'
import { formatLogMessage } from './format'

const g = global as any

g.log = {
    error (message: string, error?: Error) {
        log('error', '[main]: ' + formatLogMessage(message, error))
    },
    warn (message: string, error?: Error) {
        log('warn', '[main]: ' + formatLogMessage(message, error))
    },
    info (message: string, error?: Error) {
        log('info', '[main]: ' + formatLogMessage(message, error))
    },
    debug (message: string, error?: Error) {
        log('debug', '[main]: ' + formatLogMessage(message, error))
    }
} as ILogger
