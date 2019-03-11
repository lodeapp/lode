import { pick } from 'lodash'
import { BrowserWindow as BaseBrowserWindow } from 'electron'
import { MenuEvent } from './menu'
import { state } from '@lib/state'
import { Project as ProjectState } from '@lib/state/project'

let windowStateKeeper: any | null = null

class BrowserWindow extends BaseBrowserWindow {
    protected projectState: ProjectState | null = null
    public setProject(projectId: string): void {
        this.projectState = state.project(projectId)
    }

    public getProjectOptions (): string {
        return JSON.stringify(this.projectState ? pick(this.projectState.get('options', {}), ['id', 'name']) : {})
    }

    public isBusy (): boolean {
        return !!this.projectState && this.projectState.isBusy()
    }
}

export class Window {

    protected window: BrowserWindow

    protected winUrl = process.env.NODE_ENV === 'development'
        ? `http://localhost:9080`
        : `file://${__dirname}/index.html`

    protected minWidth = 900
    protected minHeight = 600

    public constructor(projectId: string | null) {

        if (!windowStateKeeper) {
            // `electron-window-state` requires Electron's `screen` module, which can
            // only be required after the app has emitted `ready`. So require it lazily.
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
            // windowOptions.titleBarStyle = 'hiddenInset'
        } else if (__WIN32__) {
            windowOptions.frame = false
        } else if (__LINUX__) {
            // windowOptions.icon = path.join(__dirname, 'static', 'icon-logo.png')
        }

        this.window = new BrowserWindow(windowOptions)

        // Remember window state on change
        savedWindowState.manage(this.window)

        if (projectId) {
            this.setProject(projectId)
        }
    }

    public load() {

        this.window.webContents.once('did-finish-load', () => {
            if (process.env.NODE_ENV === 'development') {
                this.window.webContents.openDevTools()
            }
        })

        this.window.webContents.on('did-finish-load', () => {
            this.window.webContents.setVisualZoomLevelLimits(1, 1)
        })

        this.window.on('focus', () => this.window.webContents.send('focus'))
        this.window.on('blur', () => this.window.webContents.send('blur'))

        this.window.loadURL(this.winUrl)
    }

    public onClose(fn: (event: any) => void) {
        this.window.on('close', fn)
    }

    public onClosed(fn: (event: any) => void) {
        this.window.on('closed', fn)
    }

    public setProject (projectId: string) {
        this.window.setProject(projectId)
    }

    public getProjectOptions (): string {
        return this.window.getProjectOptions()
    }

    public isBusy() {
        return this.window.isBusy()
    }

    public isMinimized() {
        return this.window.isMinimized()
    }

    public isVisible() {
        return this.window.isVisible()
    }

    public restore() {
        this.window.restore()
    }

    public focus() {
        this.window.focus()
    }

    public close() {
        this.window.close()
    }

    // Show the window
    public show() {
        this.window.show()
    }

    public send(channel: string) {
        this.window.webContents.send(channel)
    }

    // Send the menu event to the renderer
    public sendMenuEvent(name: MenuEvent) {
        this.show()

        this.window.webContents.send('menu-event', { name })
    }

    // Report the exception to the renderer.
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
