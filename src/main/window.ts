import { BrowserWindow } from 'electron'
import { MenuEvent } from './menu'

let windowStateKeeper: any | null = null

export class Window {
  private window: Electron.BrowserWindow

  private winUrl = process.env.NODE_ENV === 'development'
    ? `http://localhost:9080`
    : `file://${__dirname}/index.html`

  private minWidth = 900
  private minHeight = 600

  public constructor() {

    if (!windowStateKeeper) {
      // `electron-window-state` requires Electron's `screen` module, which can
      // only be required after the app has emitted `ready`. So require it
      // lazily.
      windowStateKeeper = require('electron-window-state')
    }

    // Load saved window state, if any
    const savedWindowState = windowStateKeeper({
        defaultHeight: this.minWidth,
        defaultWidth: this.minHeight
    })

    // Initial window options
    const windowOptions: Electron.BrowserWindowConstructorOptions = {
        x: savedWindowState.x,
        y: savedWindowState.y,
        width: savedWindowState.width,
        height: savedWindowState.height,
        minWidth: this.minWidth,
        minHeight: this.minHeight,
        useContentSize: true,
        backgroundColor: '#fff',
        webPreferences: {
            // Disable auxclick event
            // See https://developers.google.com/web/updates/2016/10/auxclick
            disableBlinkFeatures: 'Auxclick',
            backgroundThrottling: false,
            scrollBounce: true
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

    this.window = new BrowserWindow(windowOptions)

    // Remember window state on change
    savedWindowState.manage(this.window)
  }

  public load() {

    this.window.webContents.on('did-finish-load', () => {
      this.window.webContents.setVisualZoomLevelLimits(1, 1)
    })

    this.window.on('focus', () => this.window.webContents.send('focus'))
    this.window.on('blur', () => this.window.webContents.send('blur'))

    this.window.loadURL(this.winUrl)
  }

  public onClose(fn: () => void) {
    this.window.on('closed', fn)
  }

  public isMinimized() {
    return this.window.isMinimized()
  }

  /** Is the window currently visible? */
  public isVisible() {
    return this.window.isVisible()
  }

  public restore() {
    this.window.restore()
  }

  public focus() {
    this.window.focus()
  }

  /** Show the window. */
  public show() {
    this.window.show()
  }

  /** Send the menu event to the renderer. */
  public sendMenuEvent(name: MenuEvent) {
    this.show()

    this.window.webContents.send('menu-event', { name })
  }

  /** Report the exception to the renderer. */
  public sendException(error: Error) {
    // `Error` can't be JSONified so it doesn't transport nicely over IPC. So
    // we'll just manually copy the properties we care about.
    const friendlyError = {
      stack: error.stack,
      message: error.message,
      name: error.name,
    }
    this.window.webContents.send('main-process-exception', friendlyError)
  }

  public destroy() {
    this.window.destroy()
  }
}
