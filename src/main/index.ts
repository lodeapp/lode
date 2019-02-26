import { app, ipcMain, Menu } from 'electron'
import { buildDefaultMenu } from './menu'
import { Window } from './window'
import { mergeEnvFromShell } from '@main/lib/process/shell'
import { state } from '@main/lib/state'

// Expose garbage collector
app.commandLine.appendSwitch('js-flags', '--expose_gc')

// Merge environment variables from shell, if needed.
mergeEnvFromShell()

// Set `__static` path to static files in production
if (process.env.NODE_ENV !== 'development') {
    (global as any).__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow: Window | null = null

function createWindow(projectId: string | null) {
    const window = new Window(projectId)

    window.onClose((event: any) => {
        if (window.isBusy()) {
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

function buildMenu(options = {}) {
    Menu.setApplicationMenu(buildDefaultMenu(options))
}

app
    .on('ready', () => {
        createWindow(state.getCurrentProject())
        buildMenu()
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
    .on('update-menu', (event: any, options = {}) => {
        buildMenu(options)
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

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
    autoUpdater.quitAndInstall()
})

app.on('ready', () => {
    if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
*/
