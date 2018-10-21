'use strict'

import { app, BrowserWindow } from 'electron'
import windowStateKeeper from 'electron-window-state'

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
    global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow
const winURL = process.env.NODE_ENV === 'development'
    ? `http://localhost:9080`
    : `file://${__dirname}/index.html`

function createWindow () {
    // Load saved window state, if any
    const savedWindowState = windowStateKeeper({
        defaultHeight: 700,
        defaultWidth: 1090
    })

    // Initial window options
    const windowOptions = {
        x: savedWindowState.x,
        y: savedWindowState.y,
        width: savedWindowState.width,
        height: savedWindowState.height,
        minWidth: 900,
        minHeight: 600,
        useContentSize: true,
        backgroundColor: '#fff'
    }

    if (__DARWIN__) {
        windowOptions.titleBarStyle = 'hidden'
    } else if (__WIN32__) {
        windowOptions.frame = false
    } else if (__LINUX__) {
        // windowOptions.icon = path.join(__dirname, 'static', 'icon-logo.png')
    }

    mainWindow = new BrowserWindow(windowOptions)

    mainWindow.loadURL(winURL)

    mainWindow.on('closed', () => {
        mainWindow = null
    })

    // Remember window state on change
    savedWindowState.manage(mainWindow)
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow()
    }
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
