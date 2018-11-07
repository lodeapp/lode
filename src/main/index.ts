import * as fixPath from 'fix-path'
import { app, BrowserWindow, Menu } from 'electron'
import { buildDefaultMenu } from './menu/index'

fixPath()

let windowStateKeeper: any | null = null

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
// if (process.env.NODE_ENV !== 'development') {
//     global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
// }

let mainWindow: BrowserWindow | null
const winURL = process.env.NODE_ENV === 'development'
    ? `http://localhost:9080`
    : `file://${__dirname}/index.html`

function createWindow () {

    if (!windowStateKeeper) {
      // `electron-window-state` requires Electron's `screen` module, which can
      // only be required after the app has emitted `ready`. So require it
      // lazily.
      windowStateKeeper = require('electron-window-state')
    }

    // Load saved window state, if any
    const savedWindowState = windowStateKeeper({
        defaultHeight: 700,
        defaultWidth: 1090
    })

    // Initial window options
    const windowOptions: Electron.BrowserWindowConstructorOptions = {
        x: savedWindowState.x,
        y: savedWindowState.y,
        width: savedWindowState.width,
        height: savedWindowState.height,
        minWidth: 900,
        minHeight: 600,
        useContentSize: true,
        backgroundColor: '#fff',
        webPreferences: {
            // Disable auxclick event
            // See https://developers.google.com/web/updates/2016/10/auxclick
            disableBlinkFeatures: 'Auxclick',
            // Enable, among other things, the ResizeObserver
            experimentalFeatures: true,
        },
        acceptFirstMouse: true
    }

    if (__DARWIN__) {
        windowOptions.titleBarStyle = 'hiddenInset'
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

    mainWindow.on('focus', () => mainWindow!.webContents.send('focus'))
    mainWindow.on('blur', () => mainWindow!.webContents.send('blur'))

    // Remember window state on change
    savedWindowState.manage(mainWindow)
}

app.on('ready', () => {
    createWindow()

    const menu = buildDefaultMenu()
    Menu.setApplicationMenu(menu)
})

app.on('window-all-closed', () => {
    if (__DARWIN__) {
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
