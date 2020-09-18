import * as Path from 'path'
import { app, ipcMain, BrowserWindow as BaseBrowserWindow } from 'electron'
import { state } from '@lib/state'
import { ProjectIdentifier, ProjectOptions, Project } from '@lib/frameworks/project'
import { send } from './ipc'

let windowStateKeeper: any | null = null

export class BrowserWindow extends BaseBrowserWindow {

    protected ready: boolean = false
    protected project: Project | null = null

    public setProject(identifier: ProjectIdentifier): void {
        console.log('SETTING PROJECT ON WINDOW')
        // Instantiate new project from identifier. If it does not yet exist
        // in the store, it'll be created.
        this.project = new Project(identifier)
        this.project.on('ready', async () => {
            await this.project!.reset()
            console.log('PROJECT READY, NOTIFYING RENDERER', this.webContents)
            if (!this.ready) {
                console.log('WINDOW IS NOT YET LOADED, DEFERING')
                ipcMain.once(`${this.id}:ready`, () => {
                    this.projectReady()
                })
                return
            }
            console.log('WINDOW IS LOADED')
            this.projectReady()
        })

        // @TODO: when setting another project, make sure previous one's
        // listeners are no longer active.
        this.project.on('project-event', this.projectEventListener.bind(this))
    }

    public setReady (): void {
        this.ready = true
        ipcMain.emit(`${this.id}:ready`)
    }

    public getProject(): Project | null {
        return this.project
    }

    public getProjectOptions (): ProjectOptions {
        return this.project ? this.project.render() : {}
    }

    public projectReady (): void {
        send(this.webContents, 'project-ready', [this.getProjectOptions()])
        this.refreshSettings()
    }

    public isBusy (): boolean {
        return !!this.project && this.project.isBusy()
    }

    public clear (): void {
        this.project = null
        this.refreshSettings()
    }

    public refreshSettings (): void {
        send(this.webContents, 'settings-updated', [state.get()])
    }

    protected projectEventListener ({ id, event, args }: { id: string, event: string, args: Array<any> }): void {
        send(this.webContents, `${id}:${event}`, args)
    }
}

export class Window {

    protected window: BrowserWindow

    protected minWidth = 960
    protected minHeight = 660

    public constructor (identifier: ProjectIdentifier | null) {

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
                worldSafeExecuteJavaScript: true,
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

        // Remember "parent" window when using devtools.
        this.window.webContents.on('devtools-focused', () => {
            ipcMain.emit('window-set', this)
        })

        // Remember window state on change
        savedWindowState.manage(this.window)

        if (identifier) {
            this.setProject(identifier)
        }
    }

    public static init (identifier: ProjectIdentifier | null): Window {
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

        return window
    }

    public load() {
        this.window.webContents.once('did-finish-load', () => {
            if (process.env.NODE_ENV === 'development') {
                this.window.webContents.openDevTools()
            }
        })

        this.window.webContents.on('did-finish-load', () => {
            this.window.setReady()
            console.log('DID FINISH LOAD')
            send(this.window.webContents, 'did-finish-load', [{
                focus: this.window.isFocused()
            }])
            this.window.refreshSettings()
            this.window.webContents.setVisualZoomLevelLimits(1, 1)
        })

        this.window.on('focus', () => {
            this.window.webContents.send('focus')
            ipcMain.emit('window-set', this)
        })
        this.window.on('blur', () => this.window.webContents.send('blur'))

        this.window.loadURL(
            process.env.NODE_ENV === 'development'
                ? `http://localhost:9080`
                : `file://${__dirname}/index.html`
        )
    }

    public onClosed(fn: (event: any) => void) {
        this.window.on('closed', fn)
    }

    public async setProject (identifier: ProjectIdentifier): Promise<void> {
        this.window.setProject(identifier)
    }

    public getProject (): Project | null {
        return this.window.getProject()
    }

    public getProjectOptions (): ProjectOptions {
        return this.window.getProjectOptions()
    }

    public isBusy (): boolean {
        return this.window.isBusy()
    }

    public clear (): void {
        return this.window.clear()
    }

    public sendMenuEvent (args: any) {
        this.window.show()
        this.window.webContents.send('menu-event', args)
    }
}
