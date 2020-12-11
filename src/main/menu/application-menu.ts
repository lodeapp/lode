import { ensureDir } from 'fs-extra'
import { app, ipcMain, Menu, shell } from 'electron'
import { autoUpdater } from 'electron-updater'
import { getLogDirectoryPath } from '@lib/logger'
import { state } from '@lib/state'
import { ProjectMenu, FrameworkMenu } from '@main/menu'
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

    protected render (): void {
        const template = new Array<Electron.MenuItemConstructorOptions>()
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
            template.push({
                label: 'Lode',
                submenu: [
                    {
                        label: 'About Lode',
                        click: emit('show-about')
                    },
                    updater,
                    separator,
                    {
                        label: 'Preferences…',
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
                    { role: 'hideOthers' },
                    { role: 'unhide' },
                    separator,
                    { role: 'quit' },
                ],
            })
        }

         const fileMenu: Electron.MenuItemConstructorOptions = {
            label: __DARWIN__ ? 'File' : '&File',
            submenu: [
                {
                    label: __DARWIN__ ? 'New Project' : 'New project',
                    accelerator: 'CmdOrCtrl+N',
                    click: emit('project-add')
                },
                {
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
                }
            ]
        }

        if (!__DARWIN__) {
            const fileItems = fileMenu.submenu as Electron.MenuItemConstructorOptions[]

            fileItems.push(
                separator,
                {
                    label: 'Options…',
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
                { role: 'undo', label: 'Undo' },
                { role: 'redo', label: 'Redo' },
                separator,
                { role: 'cut', label: 'Cut' },
                { role: 'copy', label: 'Copy' },
                { role: 'paste', label: 'Paste' },
                {
                  label: 'Select all',
                  accelerator: 'CmdOrCtrl+A',
                  click: emit('select-all'),
                }
            ]
        })

        template.push({
            label: '&View',
            submenu: [
                {
                    label: __DARWIN__ ? 'Toggle Full Screen' : 'Toggle full screen',
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
                    },
                }
            ]
        })

        template.push({
            label: __DARWIN__ ? 'Project' : '&Project',
            submenu: new ProjectMenu(
                this.options.project,
                this.window!.getWebContents()
            ).getTemplate()
        })

        template.push({
            label: __DARWIN__ ? 'Framework' : 'F&ramework',
            submenu: new FrameworkMenu(
                this.options.repository,
                this.options.framework,
                this.window!.getWebContents()
            ).getTemplate()
        })

        if (__DEV__) {
            template.push({
                label: __DARWIN__ ? 'Development' : '&Development',
                submenu: [
                    {
                        label: '&Reload',
                        accelerator: 'CmdOrCtrl+Shift+0',
                        click(item: any, focusedWindow: Electron.BrowserWindow | undefined) {
                            if (focusedWindow) {
                                focusedWindow.reload()
                            }
                        },
                        visible: __DEV__
                    },
                    separator,
                    {
                        label: __DARWIN__ ? 'Log Project' : 'Log project',
                        click: emit('log-project')
                    },
                    {
                        label: __DARWIN__ ? 'Log Settings' : 'Log settings',
                        click: emit('log-settings')
                    },
                    {
                        label: __DARWIN__ ? 'Log Renderer State' : 'Log renderer state',
                        click: emit('log-renderer-state')
                    },
                    separator,
                    {
                        label: __DARWIN__
                            ? 'Show User Data Folder in Finder'
                            : __WIN32__
                                ? 'Show user data folder in Explorer'
                                : 'Show user data folder in your File Manager',
                        click() {
                            const path = app.getPath('userData')
                            ensureDir(path)
                                .then(() => {
                                    shell.openPath(path)
                                })
                                .catch(error => {
                                    log.error('Failed to opened logs directory from menu.', error)
                                })
                        }
                    },
                    separator,
                    {
                        label: 'Crash main process',
                        click() {
                            throw new Error('Boomtown!')
                        }
                    },
                    {
                        label: 'Crash renderer process',
                        click: emit('crash'),
                    }
                ]
            })
        }

        if (__DARWIN__) {
            template.push({
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
                },
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
                        click() {
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
            template.push({
                role: 'help',
                submenu: helpItems,
            })
        } else {
            template.push({
                label: '&Help',
                submenu: [
                    {
                        label: 'About Lode',
                        click: emit('show-about')
                    },
                    updater,
                    separator,
                    ...helpItems
                ]
            })
        }

        Menu.setApplicationMenu(Menu.buildFromTemplate(template))

        // Update template after rendering.
        this.template = template
    }

    public build (window: ApplicationWindow | null): Promise<Array<Electron.MenuItemConstructorOptions>> {
        this.setWindow(window)
        return this.setOptions({
            ...this.options,
            project: window ? window.getProject() : null
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
