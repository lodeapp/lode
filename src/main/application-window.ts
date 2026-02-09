import type { ProjectIdentifier, ProjectOptions } from '@lib/frameworks/project'
import * as Path from 'node:path'
import { Project } from '@lib/frameworks/project'
import { getResourceDirectory } from '@lib/helpers/paths'
import { state } from '@lib/state'
import { supportsSystemThemeChanges } from '@lib/themes'
import { applicationMenu } from '@main/menu'
import { app, BrowserWindow, ipcMain, nativeTheme } from 'electron'
import { debounce, get } from 'lodash'

const windows: { [id: number]: ApplicationWindow } = {}

export class ApplicationWindow {
    protected window: BrowserWindow

    protected minWidth = 960
    protected minHeight = 660

    protected ready = false
    protected closed = false
    protected project: Project | null = null

    protected static devToolsOpened = false

    protected events = 0
    protected themeHandler: (() => void) | null = null
    protected debouncedPersistBounds: (() => void)

    public constructor(identifier: ProjectIdentifier | null) {
        // Load saved bounds for this project, or fall back to the
        // focused window's bounds (offset so it doesn't stack on top).
        const savedBounds = identifier?.id
            ? state.getWindowBounds(identifier.id)
            : null
        const fallbackBounds = savedBounds || ApplicationWindow.getFallbackBounds()

        // Initial window options
        const windowOptions: Electron.BrowserWindowConstructorOptions = {
            x: fallbackBounds?.x,
            y: fallbackBounds?.y,
            width: fallbackBounds?.width || this.minWidth,
            height: fallbackBounds?.height || this.minHeight,
            minWidth: this.minWidth,
            minHeight: this.minHeight,
            useContentSize: true,
            backgroundColor: nativeTheme.shouldUseDarkColors ? '#161B22' : '#EAEEF2',
            webPreferences: {
                // Disable auxclick event
                // See https://developers.google.com/web/updates/2016/10/auxclick
                disableBlinkFeatures: 'Auxclick',
                backgroundThrottling: false,
                scrollBounce: true,
                nodeIntegration: false,
                contextIsolation: true,
                safeDialogs: true,
                preload: Path.resolve(getResourceDirectory(), 'preload.js'),
            },
            acceptFirstMouse: true,
            vibrancy: 'under-window',
            transparent: false,
        }

        if (__DARWIN__) {
            windowOptions.titleBarStyle = 'hiddenInset'
        }
        else if (__WIN32__) {
            windowOptions.frame = false
        }
        else if (__LINUX__) {
            windowOptions.icon = Path.join(__static, 'icons/1024x1024.png')
        }

        this.window = new BrowserWindow(windowOptions)

        // Remember "parent" window when using devtools.
        this.window.webContents.on('devtools-focused', () => {
            ipcMain.emit('window-set', this)
        })

        // Auto-persist bounds on resize/move (debounced)
        this.debouncedPersistBounds = debounce(() => {
            this.persistBounds()
        }, 500)
        this.window.on('resize', this.debouncedPersistBounds)
        this.window.on('move', this.debouncedPersistBounds)

        if (identifier) {
            this.setProject(identifier)
        }

        this.load()

        this.themeHandler = () => {
            this.window.webContents.send('theme-updated', nativeTheme.shouldUseDarkColors ? 'dark' : 'light')
        }
        nativeTheme.on('updated', this.themeHandler)
    }

    public static createWindow(identifier: ProjectIdentifier | null): ApplicationWindow {
        const window = new this(identifier)

        // Store in window registry
        windows[window.getChild().id] = window

        window.onClosed(async () => {
            window.closed = true
            if (window.isBusy()) {
                log.info('Window is busy. Attempting teardown of pending processes.')
                try {
                    await window.getProject()!.stop()
                }
                catch (_) {}
            }
            window.persistBounds()
            delete windows[window.getChild().id]
            ApplicationWindow.persistOpenProjects()
        })

        ApplicationWindow.persistOpenProjects()

        return window
    }

    /**
     * @deprecated Use createWindow() instead for multi-window support.
     */
    public static init(identifier: ProjectIdentifier | null): ApplicationWindow {
        return this.createWindow(identifier)
    }

    public static getFromWebContents(webContents: Electron.WebContents): ApplicationWindow | null {
        const child = BrowserWindow.fromWebContents(webContents)
        return child ? windows[child.id] : null
    }

    public static getProjectFromWebContents(webContents: Electron.WebContents): Project | null {
        const window = this.getFromWebContents(webContents)
        return window ? window.getProject() : null
    }

    public static getByProjectId(projectId: string): ApplicationWindow | null {
        for (const id of Object.keys(windows)) {
            const window = windows[Number(id)]
            const project = window.getProject()
            if (project && project.getId() === projectId) {
                return window
            }
        }
        return null
    }

    public static getAllWindows(): ApplicationWindow[] {
        return Object.values(windows)
    }

    public static getFocusedWindow(): ApplicationWindow | null {
        const focused = BrowserWindow.getFocusedWindow()
        if (focused) {
            return windows[focused.id] || null
        }
        // Fall back to the first available window
        const all = ApplicationWindow.getAllWindows()
        return all.length > 0 ? all[0] : null
    }

    protected static getFallbackBounds(): { x?: number, y?: number, width: number, height: number } | null {
        // Use the focused (or most recent) window's bounds, offset
        // slightly so the new window doesn't sit directly on top.
        const source = ApplicationWindow.getFocusedWindow()
        if (source && !source.closed && !source.getChild().isDestroyed()) {
            const bounds = source.getChild().getBounds()
            return {
                x: bounds.x + 22,
                y: bounds.y + 22,
                width: bounds.width,
                height: bounds.height,
            }
        }
        return null
    }

    public static persistOpenProjects(): void {
        const projectIds: string[] = []
        for (const window of ApplicationWindow.getAllWindows()) {
            const project = window.getProject()
            if (project) {
                projectIds.push(project.getId())
            }
        }
        state.setOpenProjects(projectIds)
    }

    protected load() {
        this.window.webContents.once('did-finish-load', () => {
            if (process.env.NODE_ENV === 'development' && !ApplicationWindow.devToolsOpened) {
                ApplicationWindow.devToolsOpened = true
                this.window.webContents.openDevTools()
            }
        })

        this.window.webContents.on('did-finish-load', () => {
            this.onReady()
            this.window.webContents.send('did-finish-load', {
                theme: nativeTheme.shouldUseDarkColors ? 'dark' : 'light',
                supportsThemes: supportsSystemThemeChanges(),
                runningUnderARM64Translation: app.runningUnderARM64Translation,
                menu: applicationMenu.getSections(),
                projectId: get(this.getProject(), 'id', null),
                focus: this.window.isFocused(),
                maximized: this.window.isMaximized(),
                fullscreen: this.window.isFullScreen(),
                version: app.getVersion(),
                arch: process.arch,
                nodeVersion: process.versions.node,
            })
            this.window.webContents.setVisualZoomLevelLimits(1, 1)
        })

        this.window.on('close', () => {
            // Remove only this window's theme listener
            if (this.themeHandler) {
                nativeTheme.removeListener('updated', this.themeHandler)
                this.themeHandler = null
            }
            // Frameless window doesn't seem to want to close normally in
            // Windows, so we'll destroy it instead.
            if (__WIN32__) {
                this.window.destroy()
            }
        })

        this.window.on('focus', () => {
            this.window.webContents.send('focus')
            ipcMain.emit('window-set', this)
        })
        this.window.on('blur', () => this.window.webContents.send('blur'))
        this.window.on('maximize', () => this.window.webContents.send('maximize'))
        this.window.on('unmaximize', () => this.window.webContents.send('unmaximize'))
        this.window.on('enter-full-screen', () => this.window.webContents.send('enter-full-screen'))
        this.window.on('leave-full-screen', () => this.window.webContents.send('leave-full-screen'))

        this.window.loadURL(
            process.env.NODE_ENV === 'development'
                ? (process.env.ELECTRON_RENDERER_URL || 'http://localhost:9080')
                : `file://${Path.join(__dirname, 'index.html')}`,
        )
    }

    public send(event: string, args: Array<any> = []) {
        this.events++
        this.window.webContents.send(event, ...args)
    }

    public reload() {
        this.window.reload()
    }

    public onClosed(fn: () => void) {
        (this.window as Electron.BaseWindow).on('closed', fn)
    }

    public setProject(identifier: ProjectIdentifier): void {
        // Instantiate new project from identifier. If it does not yet exist
        // in the store, it'll be created.
        this.project = new Project(this, identifier)
        this.project
            // @TODO: when setting another project, make sure previous one's
            // listeners are no longer active.
            .on('ready', async () => {
                if (!this.ready) {
                    return
                }
                this.projectReady()
            })
            .on('progress', this.updateProgress.bind(this))

        // Update the open projects list
        ApplicationWindow.persistOpenProjects()
    }

    public onReady(): void {
        this.ready = true
        this.refreshSettings()
        // If project and window are ready, send to renderer, otherwise wait for
        // `this.setProject` ready listener to trigger it. This means we can have
        // have the project ready in the main process and reload the renderer.
        if (this.project && this.project.isReady()) {
            this.projectReady()
        }
    }

    public canReceiveEvents(): boolean {
        return !this.closed
    }

    public getChild(): BrowserWindow {
        return this.window
    }

    public getWebContents(): Electron.WebContents {
        return this.window.webContents
    }

    public getProject(): Project | null {
        return this.project
    }

    public getProjectOptions(): ProjectOptions {
        return this.project ? this.project.render() : {}
    }

    public async projectReady(): Promise<void> {
        await this.project!.reset()
        this.window.webContents.send('project-ready', this.getProjectOptions())
        this.refreshActiveFramework()
        this.refreshSettings()
    }

    public onProjectLoadingFailure(id: string): void {
        this.window.webContents.send('project-loading-failed', id)
    }

    public refreshActiveFramework(): void {
        if (this.project) {
            const { framework, repository } = this.project.getActive()
            this.send('framework-active', [
                framework ? framework.getId() : null,
                repository ? repository.render() : null,
            ])
        }
    }

    protected refreshSettings(): void {
        this.send('settings-updated', [state.get()])
    }

    protected updateProgress(progress: number): void {
        if (this.canReceiveEvents()) {
            // If project progress has reached 100%, disable the progress bar.
            this.window.setProgressBar(progress === 1 ? -1 : progress)
        }
    }

    public isBusy(): boolean {
        return !!this.project && this.project.isBusy()
    }

    public clear(): void {
        this.project = null
        this.refreshSettings()
        this.send('clear')
        ApplicationWindow.persistOpenProjects()
    }

    public persistBounds(): void {
        if (this.closed || this.window.isDestroyed()) {
            return
        }
        const project = this.getProject()
        if (project) {
            state.setWindowBounds(project.getId(), this.window.getBounds())
        }
    }

    public sendMenuEvent(properties: any) {
        this.window.show()
        this.window.webContents.send('menu-event', properties)
    }
}
