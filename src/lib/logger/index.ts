import * as Path from 'path'
import * as winston from 'winston'
import { ensureDir } from 'fs-extra'
import { app } from 'electron'
import { LogLevel } from './levels'

const DailyRotateFile = require('winston-daily-rotate-file')
const { combine, timestamp, printf } = winston.format

let logDirectoryPath: string | null = null

export function getLogDirectoryPath() {
    if (!logDirectoryPath) {
        const userData = app.getPath('userData')
        logDirectoryPath = Path.join(userData, 'logs')
    }

    return logDirectoryPath
}

/**
 * Initializes winston and returns a subset of the available log level
 * methods (debug, info, error). This method should only be called once
 * during an application's lifetime.
 *
 * @param path The path where to write log files. This path will have
 *             the current date prepended to the basename part of the
 *             path such that passing a path '/logs/foo' will end up
 *             writing to '/logs/2017-05-17.foo'
 */
function initializeWinston(path: string): winston.LogMethod {
    const fileLogger = new DailyRotateFile({
        dirname: path,
        filename: 'lode-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        level: 'info',
        maxFiles: '14d',
        format: combine(
            timestamp(),
            printf(({ level, message, timestamp }) => {
                return `${timestamp} - ${level} ${message}`;
            })
        )
    })

    const consoleLogger = new winston.transports.Console({
        level: __DEV__ ? 'debug' : 'error'
    })

    winston.configure({
        transports: [consoleLogger, fileLogger]
    })

    return winston.log
}

let loggerPromise: Promise<winston.LogMethod> | null = null

/**
 * Initializes and configures winston (if necessary) to write to Electron's
 * console as well as to disk.
 *
 * @returns a function reference which can be used to write log entries,
 *          this function is equivalent to that of winston.log in that
 *          it accepts a log level, a message and an optional callback
 *          for when the event has been written to all destinations.
 */
function getLogger(): Promise<winston.LogMethod> {
    if (loggerPromise) {
        return loggerPromise
    }

    loggerPromise = new Promise<winston.LogMethod>((resolve, reject) => {
        const logDirectory = getLogDirectoryPath()

        ensureDir(logDirectory)
            .then(() => {
                try {
                    const logger = initializeWinston(logDirectory)
                    resolve(logger)
                } catch (err) {
                    reject(err)
                }
            })
            .catch(error => {
                reject(error)
            })
        })

    return loggerPromise
}

/**
 * Write the given log entry to all configured transports,
 * see initializeWinston in logger.ts for more details about
 * what transports we set up.
 *
 * Returns a promise that will never yield an error and which
 * resolves when the log entry has been written to all transports
 * or if the entry could not be written due to an error.
 */
export async function log(level: LogLevel, message: string) {
    try {
        const logger = await getLogger()
        await new Promise<void>((resolve, reject) => {
            logger(level, message, error => {
                if (error) {
                    reject(error)
                } else {
                    resolve()
                }
            })
        })
    } catch (error) {
        // ...
    }
}

