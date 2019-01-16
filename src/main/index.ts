import * as fixPath from 'fix-path'
import { app, ipcMain, Menu } from 'electron'
import { Config } from './lib/config'
import { buildDefaultMenu } from './menu'
import { Window } from './window'

fixPath()

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
// if (process.env.NODE_ENV !== 'development') {
//     global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
// }

let mainWindow: Window | null = null

function createWindow() {
  const window = new Window()

  window.onClose(() => {
    mainWindow = null
    app.quit()
  })

  window.load()

  mainWindow = window
}

function buildMenu() {
    Menu.setApplicationMenu(buildDefaultMenu({
        currentProject: Config.get('currentProject'),
        projects: Config.get('projects')
    }))
}

app.on('ready', () => {
    createWindow()
    buildMenu()
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

ipcMain.on('project-changed', () => {
    buildMenu()
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
