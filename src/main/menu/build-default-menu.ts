import { Menu, ipcMain } from 'electron'
import { ensureItemIds } from './ensure-item-ids'
import { MenuEvent } from './menu-event'


// import { log } from '../log'
// import { ensureDir } from 'fs-extra'
// import { openDirectorySafe } from '../shell'

export function buildDefaultMenu (): Electron.Menu {
  const template = new Array<Electron.MenuItemConstructorOptions>()
  const separator: Electron.MenuItemConstructorOptions = { type: 'separator' }

  if (__DARWIN__) {
    template.push({
      label: 'Lode',
      submenu: [
        {
          label: 'About Lode',
          click: emit('show-about'),
          id: 'about',
        },
        separator,
        {
          label: 'Preferences…',
          id: 'preferences',
          accelerator: 'CmdOrCtrl+,',
          click: emit('show-preferences'),
        },
        separator,
        {
          role: 'services',
          submenu: [],
        },
        separator,
        { role: 'hide' },
        { role: 'hideothers' },
        { role: 'unhide' },
        separator,
        { role: 'quit' },
      ],
    })
  }

  const fileMenu: Electron.MenuItemConstructorOptions = {
    label: __DARWIN__ ? 'File' : '&File',
    submenu: [
      // {
      //   label: __DARWIN__ ? 'New Project…' : 'New project…',
      //   id: 'new-project',
      //   accelerator: 'CmdOrCtrl+N',
      //   click: emit('new-project'),
      // }
    ],
  }

  if (!__DARWIN__) {
    const fileItems = fileMenu.submenu as Electron.MenuItemConstructorOptions[]

    fileItems.push(
      separator,
      {
        label: '&Options…',
        id: 'preferences',
        accelerator: 'CmdOrCtrl+,',
        click: emit('show-preferences'),
      },
      separator,
      { role: 'quit' }
    )
  }

  template.push(fileMenu)

  template.push({
    label: __DARWIN__ ? 'Edit' : '&Edit',
    submenu: [
      { role: 'undo', label: __DARWIN__ ? 'Undo' : '&Undo' },
      { role: 'redo', label: __DARWIN__ ? 'Redo' : '&Redo' },
      separator,
      { role: 'cut', label: __DARWIN__ ? 'Cut' : 'Cu&t' },
      { role: 'copy', label: __DARWIN__ ? 'Copy' : '&Copy' },
      { role: 'paste', label: __DARWIN__ ? 'Paste' : '&Paste' }
    ],
  })

  template.push({
    label: __DARWIN__ ? 'View' : '&View',
    submenu: [
      {
        label: __DARWIN__ ? 'Toggle Full Screen' : 'Toggle &full screen',
        role: 'togglefullscreen',
      },
      separator,
      {
        label: __DARWIN__ ? 'Reset Zoom' : 'Reset zoom',
        accelerator: 'CmdOrCtrl+0',
        click: zoom(ZoomDirection.Reset),
      },
      {
        label: __DARWIN__ ? 'Zoom In' : 'Zoom in',
        accelerator: 'CmdOrCtrl+=',
        click: zoom(ZoomDirection.In),
      },
      {
        label: __DARWIN__ ? 'Zoom Out' : 'Zoom out',
        accelerator: 'CmdOrCtrl+-',
        click: zoom(ZoomDirection.Out),
      },
      separator,
      {
        label: '&Reload',
        id: 'reload-window',
        // Ctrl+Alt is interpreted as AltGr on international keyboards and this
        // can clash with other shortcuts. We should always use Ctrl+Shift for
        // chorded shortcuts, but this menu item is not a user-facing feature
        // so we are going to keep this one around and save Ctrl+Shift+R for
        // a different shortcut in the future...
        accelerator: 'CmdOrCtrl+Alt+R',
        click(item: any, focusedWindow: Electron.BrowserWindow) {
          if (focusedWindow) {
            focusedWindow.reload()
          }
        },
        visible: __DEV__,
      },
      {
        id: 'show-devtools',
        label: __DARWIN__
          ? 'Toggle Developer Tools'
          : '&Toggle developer tools',
        accelerator: (() => {
          return __DARWIN__ ? 'Alt+Command+I' : 'Ctrl+Shift+I'
        })(),
        click(item: any, focusedWindow: Electron.BrowserWindow) {
          if (focusedWindow) {
            focusedWindow.webContents.toggleDevTools()
          }
        },
      },
    ],
  })

  if (__DARWIN__) {
    template.push({
      role: 'window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { role: 'close' },
        separator,
        { role: 'front' },
      ],
    })
  }

  // const submitIssueItem: Electron.MenuItemConstructorOptions = {
  //   label: __DARWIN__ ? 'Report Issue…' : 'Report issue…',
  //   click() {
  //     shell.openExternal('https://github.com/desktop/desktop/issues/new/choose')
  //   },
  // }

  // const contactSupportItem: Electron.MenuItemConstructorOptions = {
  //   label: __DARWIN__ ? 'Contact GitHub Support…' : '&Contact GitHub support…',
  //   click() {
  //     shell.openExternal(
  //       `https://github.com/contact?from_desktop_app=1&app_version=${app.getVersion()}`
  //     )
  //   },
  // }

  // const showUserGuides: Electron.MenuItemConstructorOptions = {
  //   label: 'Show User Guides',
  //   click() {
  //     shell.openExternal('https://help.github.com/desktop/guides/')
  //   },
  // }

  // const showLogsLabel = __DARWIN__
  //   ? 'Show Logs in Finder'
  //   : __WIN32__
  //     ? 'S&how logs in Explorer'
  //     : 'S&how logs in your File Manager'

  // const showLogsItem: Electron.MenuItemConstructorOptions = {
  //   label: showLogsLabel,
  //   click() {
  //     const logPath = getLogDirectoryPath()
  //     ensureDir(logPath)
  //       .then(() => {
  //         openDirectorySafe(logPath)
  //       })
  //       .catch(err => {
  //         // log('error', err.message)
  //       })
  //   },
  // }

  const helpItems = [
    // submitIssueItem,
    // contactSupportItem,
    // showUserGuides,
    // showLogsItem,
  ]

  if (__DEV__) {
    helpItems.push(
      separator,
      {
        label: 'Crash main process…',
        click() {
          throw new Error('Boomtown!')
        },
      },
      {
        label: 'Crash renderer process…',
        click: emit('boomtown'),
      }
    )
  }

  if (__DARWIN__) {
    if (helpItems.length) {
      template.push({
        role: 'help',
        submenu: helpItems,
      })
    }
  } else {
    template.push({
      label: '&Help',
      submenu: [
        ...helpItems,
        separator,
        {
          label: '&About Lode',
          click: emit('show-about'),
          id: 'about',
        },
      ],
    })
  }

  ensureItemIds(template)

  return Menu.buildFromTemplate(template)
}

type ClickHandler = (
  menuItem: Electron.MenuItem,
  browserWindow: Electron.BrowserWindow,
  event: Electron.Event
) => void

/**
 * Utility function returning a Click event handler which, when invoked, emits
 * the provided menu event over IPC.
 */
function emit(name: MenuEvent): ClickHandler {
  return (menuItem, window) => {
    if (window) {
      window.webContents.send('menu-event', { name })
    } else {
      ipcMain.emit('menu-event', { name })
    }
  }
}

enum ZoomDirection {
  Reset,
  In,
  Out,
}

/** The zoom steps that we support, these factors must sorted */
const ZoomInFactors = [1, 1.1, 1.25, 1.5, 1.75, 2]
const ZoomOutFactors = ZoomInFactors.slice().reverse()

/**
 * Returns the element in the array that's closest to the value parameter. Note
 * that this function will throw if passed an empty array.
 */
function findClosestValue(arr: Array<number>, value: number) {
  return arr.reduce((previous, current) => {
    return Math.abs(current - value) < Math.abs(previous - value)
      ? current
      : previous
  })
}

/**
 * Figure out the next zoom level for the given direction and alert the renderer
 * about a change in zoom factor if necessary.
 */
function zoom(direction: ZoomDirection): ClickHandler {
  return (menuItem, window) => {
    if (!window) {
      return
    }

    const { webContents } = window

    if (direction === ZoomDirection.Reset) {
      webContents.setZoomFactor(1)
      webContents.send('zoom-factor-changed', 1)
    } else {
      webContents.getZoomFactor(rawZoom => {
        const zoomFactors =
          direction === ZoomDirection.In ? ZoomInFactors : ZoomOutFactors

        // So the values that we get from getZoomFactor are floating point
        // precision numbers from chromium that don't always round nicely so
        // we'll have to do a little trick to figure out which of our supported
        // zoom factors the value is referring to.
        const currentZoom = findClosestValue(zoomFactors, rawZoom)

        const nextZoomLevel = zoomFactors.find(
          f =>
            direction === ZoomDirection.In ? f > currentZoom : f < currentZoom
        )

        // If we couldn't find a zoom level (likely due to manual manipulation
        // of the zoom factor in devtools) we'll just snap to the closest valid
        // factor we've got.
        const newZoom =
          nextZoomLevel === undefined ? currentZoom : nextZoomLevel

        webContents.setZoomFactor(newZoom)
        webContents.send('zoom-factor-changed', newZoom)
      })
    }
  }
}
