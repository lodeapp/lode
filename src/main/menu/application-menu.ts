import { compact } from 'lodash'
import { ensureDir } from 'fs-extra'
import { app, ipcMain, Menu, shell } from 'electron'
import { autoUpdater } from 'electron-updater'
import { getLogDirectoryPath } from '@lib/logger'
import { state } from '@lib/state'
import { Menu as ContextMenu, ProjectMenu, FrameworkMenu } from '@main/menu'
import { ApplicationWindow } from '@main/application-window'
import { ProjectIdentifier, IProject } from '@lib/frameworks/project'
import { IRepository } from '@lib/frameworks/repository'
import { IFramework } from '@lib/frameworks/framework'

type ClickHandler = (
    menuItem: Electron.MenuItem,
    browserWindow: Electron.BrowserWindow | undefined,
    event: Electron.KeyboardEvent
) => void

enum ZoomDirection {
    Reset,
    In,
    Out,
}

class ApplicationMenu {
    protected template: Array<Electron.MenuItemConstructorOptions> = []

    protected window: ApplicationWindow | null = null

    protected options: {
        project: IProject | null,
        repository: IRepository | null
        framework: IFramework | null,
        isCheckingForUpdate: boolean,
        isDownloadingUpdate: boolean,
        hasDownloadedUpdate: boolean
    } = {
        project: null,
        repository: null,
        framework: null,
        isCheckingForUpdate: false,
        isDownloadingUpdate: false,
        hasDownloadedUpdate: false
    }

    protected menus: {
        [key: string]: ContextMenu
    } = {}

    protected render (): void {
        this.template = []

        const separator: Electron.MenuItemConstructorOptions = { type: 'separator' }

        const currentProject: ProjectIdentifier | null = state.getCurrentProject()
        const projects: Array<ProjectIdentifier> = state.getAvailableProjects()

        const isCheckingForUpdate = this.options.isCheckingForUpdate
        const isDownloadingUpdate = this.options.isDownloadingUpdate
        const hasDownloadedUpdate = this.options.hasDownloadedUpdate
        const updater = {
            label: isDownloadingUpdate
                ? 'Downloading Update'
                : (hasDownloadedUpdate ? 'Restart and Install Update' : 'Check for Updates…'),
            enabled: !isCheckingForUpdate && !isDownloadingUpdate && !__DEV__,
            click () {
                if (hasDownloadedUpdate) {
                    autoUpdater.quitAndInstall()
                }
                autoUpdater.checkForUpdates()
            }
        }

        if (__DARWIN__) {
            this.addSection('Lode', new ContextMenu(this.window!.getWebContents())
                .add({
                    label: 'About Lode',
                    click: emit('show-about')
                })
                .add(updater)
                .separator()
                .add({
                    label: 'Preferences…',
                    accelerator: 'CmdOrCtrl+,',
                    click: emit('show-preferences')
                })
                .separator()
                .add({
                    role: 'services',
                    submenu: []
                })
                .separator()
                .add({ role: 'hide' })
                .add({ role: 'hideOthers' })
                .add({ role: 'unhide' })
                .separator()
                .add({
                    role: 'quit'
                })
            )
        }

        this.addSection('&File', new ContextMenu(this.window!.getWebContents())
            .add({
                label: __DARWIN__ ? 'New Project' : 'New project',
                accelerator: 'CmdOrCtrl+N',
                click: emit('project-add')
            })
            .add({
                label: __DARWIN__ ? 'Switch Project' : 'Switch project',
                enabled: projects && projects.length > 1,
                submenu: projects && projects.length > 1 ? projects.map(project => {
                    return {
                        label: project.name,
                        type: 'checkbox',
                        checked: !!currentProject && currentProject.id === project.id,
                        click: emit('project-switch', project.id, (menuItem: Electron.MenuItem) => {
                            // Don't toggle the item, unless it's the current project,
                            // as the switch might still be cancelled by the user. If
                            // switch project is confirmed, menu will be rebuilt anyway.
                            menuItem.checked = !!currentProject && currentProject.id === project.id
                        })
                    }
                }) : undefined
            })
            .addIf(!__DARWIN__, separator)
            .addIf(!__DARWIN__, {
                label: 'Options…',
                accelerator: 'CmdOrCtrl+,',
                click: emit('show-preferences')
            })
            .addIf(!__DARWIN__, separator)
            .addIf(!__DARWIN__, {
                role: 'quit',
                accelerator: 'Alt+F4'
            })
        )

        this.addSection('&Edit', new ContextMenu(this.window!.getWebContents())
            .add({ role: 'undo', label: 'Undo' })
            .add({ role: 'redo', label: 'Redo' })
            .separator()
            .add({ role: 'cut', label: 'Cut' })
            .add({ role: 'copy', label: 'Copy' })
            .add({ role: 'paste', label: 'Paste' })
            .add({
                label: 'Select all',
                accelerator: 'CmdOrCtrl+A',
                click: emit('select-all')
            })
        )

        this.addSection('&View', new ContextMenu(this.window!.getWebContents())
            .add({
                label: __DARWIN__ ? 'Toggle Full Screen' : 'Toggle &full screen',
                role: 'togglefullscreen',
                accelerator: __DARWIN__ ? undefined : 'F11'
            })
            .separator()
            .add({
                label: __DARWIN__ ? 'Reset Zoom' : 'Reset zoom',
                accelerator: 'CmdOrCtrl+0',
                click: zoom(ZoomDirection.Reset)
            })
            .add({
                label: __DARWIN__ ? 'Zoom In' : 'Zoom in',
                accelerator: 'CmdOrCtrl+=',
                click: zoom(ZoomDirection.In)
            })
            .add({
                label: __DARWIN__ ? 'Zoom Out' : 'Zoom out',
                accelerator: 'CmdOrCtrl+-',
                click: zoom(ZoomDirection.Out)
            })
            .separator()
            .add({
                label: __DARWIN__
                    ? 'Toggle Developer Tools'
                    : 'Toggle developer tools',
                accelerator: (() => {
                    return __DARWIN__ ? 'Alt+Command+I' : 'Ctrl+Shift+I'
                })(),
                click (item: any, focusedWindow: Electron.BrowserWindow | undefined) {
                    if (focusedWindow) {
                        focusedWindow.webContents.toggleDevTools()
                    }
                }
            })
        )

        this.addSection('&Project', new ProjectMenu(
            this.options.project,
            this.window!.getWebContents()
        ))

        this.addSection('F&ramework', new FrameworkMenu(
            this.options.repository,
            this.options.framework,
            this.window!.getWebContents()
        ))

        if (__DEV__) {
            this.addSection('&Development', new ContextMenu(this.window!.getWebContents())
                .add({
                    label: '&Reload',
                    accelerator: 'CmdOrCtrl+Shift+0',
                    click (item: any, focusedWindow: Electron.BrowserWindow | undefined) {
                        if (focusedWindow) {
                            focusedWindow.reload()
                        }
                    },
                    visible: __DEV__
                })
                .separator()
                .add({
                    label: __DARWIN__ ? 'Log Project' : 'Log project',
                    click: emit('log-project')
                })
                .add({
                    label: __DARWIN__ ? 'Log Settings' : 'Log settings',
                    click: emit('log-settings')
                })
                .add({
                    label: __DARWIN__ ? 'Log Renderer State' : 'Log renderer state',
                    click: emit('log-renderer-state')
                })
                .separator()
                .add({
                    label: __DARWIN__
                        ? 'Show User Data Folder in Finder'
                        : __WIN32__
                            ? 'Show user data folder in Explorer'
                            : 'Show user data folder in your File Manager',
                    click () {
                        const path = app.getPath('userData')
                        ensureDir(path)
                            .then(() => {
                                shell.openPath(path)
                            })
                            .catch(error => {
                                log.error('Failed to opened logs directory from menu.', error)
                            })
                    }
                })
                .separator()
                .add({
                    label: 'Crash main process',
                    click () {
                        throw new Error('Boomtown!')
                    }
                })
                .add({
                    label: 'Crash renderer process',
                    click: emit('crash')
                })
            )
        }

        if (__DARWIN__) {
            this.template.push({
                role: 'window',
                submenu: [
                    { role: 'minimize' },
                    { role: 'zoom' },
                    { role: 'close' },
                    separator,
                    { role: 'front' }
                ]
            })
        }

        const helpItems = [
            {
                label: __DARWIN__ ? 'Report Issue' : 'Report issue',
                click () {
                    shell.openExternal(
                        'https://github.com/lodeapp/lode/issues/new/choose'
                    ).catch(err => log.error('Failed opening issue creation page', err))
                }
            },
            {
                label: __DARWIN__ ? 'Contact Support' : 'Contact support',
                click: emit('feedback')
            },
            {
                label: __DARWIN__ ? 'Show Documentation' : 'Show documentation',
                click () {
                    shell.openExternal(
                        'https://lode.run/documentation/'
                    ).catch(err => log.error('Failed opening documentation page', err))
                }
            },
            separator,
            {
                label: 'Troubleshooting',
                submenu: [
                    {
                        label: __DARWIN__
                            ? 'Show Logs in Finder'
                            : __WIN32__
                                ? 'Show logs in Explorer'
                                : 'Show logs in your File Manager',
                        click () {
                            const path = getLogDirectoryPath()
                            ensureDir(path)
                                .then(() => {
                                    shell.openPath(path)
                                })
                                .catch(error => {
                                    log.error('Failed to opened logs directory from menu.', error)
                                })
                        }
                    },
                    {
                        label: __DARWIN__ ? 'Reset Settings…' : 'Reset settings…',
                        click: emit('settings-reset')
                    }
                ]
            }
        ]

        if (__DARWIN__) {
            this.template.push({
                role: 'help',
                submenu: helpItems
            })
        } else {
            this.addSection('&Help', new ContextMenu(this.window!.getWebContents())
                .add({
                    label: 'About Lode',
                    click: emit('show-about')
                })
                .add(updater)
                .separator()
                .addMultiple(helpItems)
            )
        }

        Menu.setApplicationMenu(Menu.buildFromTemplate(this.template))
    }

    protected addSection (label: string, menu: ContextMenu): void {
        this.menus[label] = menu
        this.template.push({
            label,
            submenu: menu.getTemplate()
        })
    }

    public build (window: ApplicationWindow | null): Promise<Array<Electron.MenuItemConstructorOptions>> {
        this.setWindow(window)
        const project = window ? window.getProject() : null
        return this.setOptions({
            ...this.options,
            ...project ? project.getActive() : {},
            project
        })
    }

    public setWindow (window: ApplicationWindow | null): void {
        this.window = window
    }

    public setOptions (options: any): Promise<Array<Electron.MenuItemConstructorOptions>> {
        return new Promise((resolve, reject) => {
            this.options = {
                ...this.options,
                ...options
            }
            // Rebuild after options are updated.
            this.render()
            resolve(this.template)
        })
    }

    public getTemplate (): Array<Electron.MenuItemConstructorOptions> {
        return this.template
    }

    public getSections (): Array<string> {
        return compact(this.template.map(item => {
            return item.label || ''
        }))
    }

    public getSection (label: string): ContextMenu {
        return this.menus[label]
    }
}

/**
 * Utility function returning a Click event handler which, when invoked, emits
 * the provided menu event over IPC.
 */
function emit (name: MenuEvent, properties?: any, callback?: Function): ClickHandler {
    return (menuItem, window, event) => {
        if (window) {
            window.webContents.send('menu-event', { name, properties })
        } else {
            ipcMain.emit('menu-event', { name, properties })
        }

        if (callback) {
            callback(menuItem, window, event)
        }
    }
}

/** The zoom steps that we support, these factors must sorted */
const ZoomInFactors = [1, 1.1, 1.25, 1.5, 1.75, 2]
const ZoomOutFactors = ZoomInFactors.slice().reverse()

/**
 * Returns the element in the array that's closest to the value parameter. Note
 * that this function will throw if passed an empty array.
 */
function findClosestValue (arr: Array<number>, value: number) {
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
function zoom (direction: ZoomDirection): ClickHandler {
    return (menuItem, window) => {
        if (!window) {
            return
        }

        const { webContents } = window

        if (direction === ZoomDirection.Reset) {
            webContents.setZoomFactor(1)
            webContents.send('zoom-factor-changed', 1)
        } else {
            const rawZoom: number = webContents.getZoomFactor()
            const zoomFactors = direction === ZoomDirection.In ? ZoomInFactors : ZoomOutFactors

            // So the values that we get from getZoomFactor are floating point
            // precision numbers from chromium that don't always round nicely so
            // we'll have to do a little trick to figure out which of our supported
            // zoom factors the value is referring to.
            const currentZoom = findClosestValue(zoomFactors, rawZoom)

            const nextZoomLevel = zoomFactors.find(f => direction === ZoomDirection.In ? f > currentZoom : f < currentZoom)

            // If we couldn't find a zoom level (likely due to manual manipulation
            // of the zoom factor in devtools) we'll just snap to the closest valid
            // factor we've got.
            const newZoom = nextZoomLevel === undefined ? currentZoom : nextZoomLevel

            webContents.setZoomFactor(newZoom)
            webContents.send('zoom-factor-changed', newZoom)
        }
    }
}

export const applicationMenu = new ApplicationMenu()
