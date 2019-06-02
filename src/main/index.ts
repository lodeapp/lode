import '@lib/logger/main'

import { app, ipcMain } from 'electron'
import { applicationMenu } from './menu'
import { Window } from './window'
import { Updater } from './updater'
import { LogLevel } from '@lib/logger/levels'
import { mergeEnvFromShell } from '@lib/process/shell'
import { state } from '@lib/state'
import { log as writeLog } from '@lib/logger'

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

    window.onClose((event: any) => {
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
        createWindow(state.getCurrentProject())
        applicationMenu.build()

        // Start auto-updating process.
        if (process.env.NODE_ENV === 'production') {
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
    .on('log', (event: Electron.IpcMessageEvent, level: LogLevel, message: string) => {
        // Write renderer messages to log, if they meet the level threshold.
        // We're using the main log function directly so that they are not
        // marked as being from the "main" process.
        writeLog(level, message)
    })
    .on('refresh-menu', (event: any) => {
        applicationMenu.build()
    })
    .on('set-menu-options', (event: any, options: any) => {
        applicationMenu.setOptions(options)
    })
    .on('window-should-close', () => {
        process.nextTick(() => {
            if (mainWindow) {
                mainWindow.close()
            }
        })
    })
    .on('switch-project', (event: any, projectId: string) => {
        state.set('currentProject', projectId)
        if (mainWindow) {
            mainWindow.setProject(projectId)
            event.sender.send('project-switched', mainWindow.getProjectOptions())
        }
    })
    .on('reset-settings', (event: any) => {
        state.reset()
        event.returnValue = true
    })
