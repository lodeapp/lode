import '@lib/crash/reporter'
import '@lib/logger/main'
import '@lib/tracker/main'

import { compact } from 'lodash'
import { app, ipcMain, session } from 'electron'
import { applicationMenu } from './menu'
import { Window } from './window'
import { Updater } from './updater'
import { LogLevel } from '@lib/logger/levels'
import { mergeEnvFromShell } from '@lib/process/shell'
import { state } from '@lib/state'
import { log as writeLog } from '@lib/logger'
import { ProcessOptions, IProcess } from '@lib/process/process'
import { ProcessFactory } from '@lib/process/factory'
import { ProcessError } from '@lib/process/errors'
import pool from '@lib/process/pool'

// Expose garbage collector
app.commandLine.appendSwitch('js-flags', '--expose_gc')

// Merge environment variables from shell, if needed.
mergeEnvFromShell()

// Set `__static` path to static files in production
if (process.env.NODE_ENV !== 'development') {
    (global as any).__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
} else {
    // Check for special development scripts (e.g. migrations)
    const argv = process.argv.slice(3)
    if (argv.length) {
        if (argv[0] === 'migrate') {
            if (argv[1] === 'down') {
                state.migrateDownTo()
            } else if (argv[1] === 'up') {
                state.migrateUpTo()
            }
        }
        process.exit()
    }
}

let mainWindow: Window | null = null

function createWindow(projectId: string | null) {
    const window = new Window(projectId)

    window.onClose((event: Electron.IpcMainEvent) => {
        if (window.isBusy()) {
            log.info('Window is busy. Attempting teardown of pending renderer processes.')
            event.preventDefault()
            window.send('close')
        }
    })

    window.onClosed(() => {
        mainWindow = null
        app.quit()
    })

    window.load()
    mainWindow = window
}

app
    .on('ready', () => {
        session!.defaultSession!.webRequest.onHeadersReceived((details, callback) => {
            callback({
                responseHeaders: {
                    ...details.responseHeaders,
                    'Content-Security-Policy': [compact([
                        'default-src \'self\'',
                        process.env.NODE_ENV === 'development' ? 'style-src \'self\' \'unsafe-inline\'' : ''
                    ]).join('; ')]
                }
            })
        })

        track.screenview('Application started')
        createWindow(state.getCurrentProject())
        applicationMenu.build()

        if (process.env.NODE_ENV === 'production') {
            // Start auto-updating process.
            new Updater()
        }
    })
    .on('window-all-closed', () => {
        if (__DARWIN__) {
            app.quit()
        }
    })
    .on('activate', () => {
        if (mainWindow === null) {
            createWindow(state.getCurrentProject())
        }
    })

ipcMain
    .on('log', (event: Electron.IpcMainEvent, level: LogLevel, message: string) => {
        // Write renderer messages to log, if they meet the level threshold.
        // We're using the main log function directly so that they are not
        // marked as being from the "main" process.
        writeLog(level, message)
    })
    .on('refresh-menu', (event: Electron.IpcMainEvent) => {
        applicationMenu.build().then((template: Array<Electron.MenuItemConstructorOptions>) => {
            event.sender.send('menu-updated', template)
        })
    })
    .on('set-menu-options', (event: Electron.IpcMainEvent, options: any) => {
        applicationMenu.setOptions(options).then((template: Array<Electron.MenuItemConstructorOptions>) => {
            event.sender.send('menu-updated', template)
        })
    })
    .on('window-should-close', () => {
        process.nextTick(() => {
            if (mainWindow) {
                mainWindow.close()
            }
        })
    })
    .on('switch-project', (event: Electron.IpcMainEvent, projectId: string) => {
        state.set('currentProject', projectId)
        if (mainWindow) {
            mainWindow.setProject(projectId)
            event.sender.send('project-switched', mainWindow.getProjectOptions())
        }
    })
    .on('reset-settings', (event: Electron.IpcMainEvent) => {
        state.reset()
        event.returnValue = true
    })
    .on('spawn', (event: Electron.IpcMainEvent, id: string, options: ProcessOptions) => {
        const process: IProcess = ProcessFactory.make(options, id)
        const events = ['close', 'killed', 'report', 'success']
        events.forEach((eventType: string) => {
            process.on(eventType, (...args: any) => {
                event.sender.send(`${id}:${eventType}`, ...args)
            })
        })
        // If an error occurs, pass the error object as string instead of
        // letting it be serialized. Should we ever want to do anything with
        // the added properties of a ProcessError, we should revist this.
        process.on('error', (error: ProcessError) => {
            event.sender.send(`${id}:error`, error.toString())
        })
    })
    .on('stop', (event: Electron.IpcMainEvent, id: string) => {
        const running = pool.findProcess(id)
        if (!running) {
            event.sender.send(`${id}:stopped`)
            return
        }

        running!
            .on('killed', () => {
                event.sender.send(`${id}:stopped`)
            })
            .stop()
    })
