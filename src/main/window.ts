import * as Path from 'path'
import { app, BrowserWindow as BaseBrowserWindow } from 'electron'
import { MenuEvent } from './menu'
import { ProjectIdentifier, Project } from '@lib/frameworks/project'

let windowStateKeeper: any | null = null

export class BrowserWindow extends BaseBrowserWindow {

    protected project: Project | null = null

    public setProject(identifier: ProjectIdentifier): void {
        // Instantiate new project from identifier. If it does not yet exist
        // in the store, it'll be created.
        this.project = new Project(identifier)

        // @TODO: when setting another project, make sure previous one's
        // listeners are no longer active.
        this.project.on('project-event', this.projectEventListener.bind(this))
    }

    public getProject(): Project | null {
        return this.project
    }

    public getProjectOptions (): string {
        return JSON.stringify(this.project ? this.project.render() : {})
    }

    public isBusy (): boolean {
        return !!this.project && this.project.isBusy()
    }

    public clear (): void {
        this.project = null
    }

    protected projectEventListener ({ id, event, args }: { id: string, event: string, args: Array<any> }): void {
        this.webContents.send(`${id}:${event}`, ...args, id)
    }
}

export class Window {

    protected window: BrowserWindow

    protected minWidth = 960
    protected minHeight = 660

    public constructor(identifier: ProjectIdentifier | null) {

        if (!windowStateKeeper) {
            // `electron-window-state` requires Electron's `screen` module, which can
            // only be required after the app has emitted `ready`. So require it lazily.
            windowStateKeeper = require('electron-window-state')
        }

        // Load saved window state, if any
        const savedWindowState = windowStateKeeper({
            defaultHeight: this.minHeight,
            defaultWidth: this.minWidth
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
                scrollBounce: true,
                nodeIntegration: true,
                contextIsolation: false,
                enableRemoteModule: true
            },
            acceptFirstMouse: true
        }

        if (__DARWIN__) {
            windowOptions.titleBarStyle = 'hiddenInset'
        } else if (__WIN32__) {
            windowOptions.frame = false
        } else if (__LINUX__) {
            windowOptions.icon = Path.join(__static, 'icons/512x512.png')
        }

        this.window = new BrowserWindow(windowOptions)

        // Remember window state on change
        savedWindowState.manage(this.window)

        if (identifier) {
            this.setProject(identifier)
        }
    }

    public static init (identifier: ProjectIdentifier | null) {
        const window = new this(identifier)

        window.onClosed(async () => {
            if (window.isBusy()) {
                log.info('Window is busy. Attempting teardown of pending processes.')
                try {
                    await window.getProject()!.stop()
                } catch (_) {}
            }
            app.quit()
        })

        window.load()
    }

    public load() {
        this.window.webContents.once('did-finish-load', () => {
            if (process.env.NODE_ENV === 'development') {
                this.window.webContents.openDevTools()
            }
        })

        this.window.webContents.on('did-finish-load', () => {
            this.window.webContents.send('did-finish-load', {
                focus: this.window.isFocused(),
                projectOptions: this.window.getProjectOptions()
            })
            this.window.webContents.setVisualZoomLevelLimits(1, 1)
        })

        this.window.on('focus', () => this.window.webContents.send('focus'))
        this.window.on('blur', () => this.window.webContents.send('blur'))

        this.window.loadURL(
            process.env.NODE_ENV === 'development'
                    ? `http://localhost:9080`
                    : `file://${__dirname}/index.html`
        )
    }

    public onClose(fn: (event: any) => void) {
        this.window.on('close', fn)
    }

    public onClosed(fn: (event: any) => void) {
        this.window.on('closed', fn)
    }

    public setProject (identifier: ProjectIdentifier): void {
        this.window.setProject(identifier)
    }

    public getProject (): Project | null {
        return this.window.getProject()
    }

    public getProjectOptions (): string {
        return this.window.getProjectOptions()
    }

    public isBusy (): boolean {
        return this.window.isBusy()
    }

    public clear (): void {
        return this.window.clear()
    }

    public isMinimized (): boolean {
        return this.window.isMinimized()
    }

    public isVisible (): boolean {
        return this.window.isVisible()
    }

    public restore (): void {
        this.window.restore()
    }

    public focus (): void {
        this.window.focus()
    }

    public close (): void {
        this.window.close()
    }

    // Show the window
    public show (): void {
        this.window.show()
    }

    public send (channel: string): void {
        this.window.webContents.send(channel)
    }

    // Send the menu event to the renderer
    public sendMenuEvent (name: MenuEvent): void {
        this.show()
        this.window.webContents.send('menu-event', { name })
    }

    // Report the exception to the renderer.
    public sendException (error: Error): void {
        // `Error` can't be JSONified so it doesn't transport nicely over IPC. So
        // we'll just manually copy the properties we care about.
        const friendlyError = {
            stack: error.stack,
            message: error.message,
            name: error.name,
        }
        this.window.webContents.send('main-process-exception', friendlyError)
    }

    public destroy (): void {
        this.window.destroy()
    }
}
