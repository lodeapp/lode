import * as Path from 'path'
import { pick } from 'lodash'
import { BrowserWindow as BaseBrowserWindow } from 'electron'
import { MenuEvent } from './menu'
import { state } from '@lib/state'
import { ProjectIdentifier, Project } from '@lib/frameworks/project'

let windowStateKeeper: any | null = null

export class BrowserWindow extends BaseBrowserWindow {

    protected project: Project | null = null

    public setProject(projectId: string): void {
        const identifier: ProjectIdentifier = pick(state.project(projectId).get('options', {}), ['id', 'name'])
        this.project = new Project(identifier)

        // @TODO: when setting another project, make sure previous one's
        // listeners are no longer active.
        this.project.on('project-event', this.projectEventListener.bind(this))
    }

    public getProject(): Project | null {
        return this.project
    }

    public getProjectOptions (): string {
        return JSON.stringify(this.project ? this.project.persist() : {})
    }

    public isBusy (): boolean {
        return !!this.project && this.project.isBusy()
    }

    protected projectEventListener ({ id, event, args }: { id: string, event: string, args: Array<any> }): void {
        this.webContents.send(`${id}:${event}`, ...args, id)
    }
}

export class Window {

    protected window: BrowserWindow

    protected minWidth = 960
    protected minHeight = 660

    public constructor(projectId: string | null) {

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
                nodeIntegration: true
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

    public setProject (projectId: string): void {
        this.window.setProject(projectId)
    }

    public getProject (): Project | null {
        return this.window.getProject()
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
