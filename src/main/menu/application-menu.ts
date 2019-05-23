import { ensureDir } from 'fs-extra'
import { app, Menu, ipcMain, shell } from 'electron'
import { MenuEvent } from './menu-event'
import { getLogDirectoryPath } from '@lib/logger'
import { state } from '@lib/state'
import { ProjectIdentifier } from '@lib/frameworks/project'
import { autoUpdater } from 'electron-updater'

// We seem to be unable to simple declare menu items as "radio" without TS
// raising an alert, so we need to forcibly cast types when defining them.
type MenuItemType = ('normal' | 'separator' | 'submenu' | 'checkbox' | 'radio')

type ClickHandler = (
    menuItem: Electron.MenuItem,
    browserWindow: Electron.BrowserWindow,
    event: Electron.Event
) => void

enum ZoomDirection {
    Reset,
    In,
    Out,
}

class ApplicationMenu {

    protected options: { [index: string]: any } = {
        hasFramework: false,
        isCheckingForUpdate: false,
        isDownloadingUpdate: false,
        hasDownloadedUpdate: false
    }

    protected render (): void {
        const template = new Array<Electron.MenuItemConstructorOptions>()
        const separator: Electron.MenuItemConstructorOptions = { type: 'separator' }

        const currentProject: string | null = state.getCurrentProject()
        const projects: Array<ProjectIdentifier> = state.getAvailableProjects()

        const hasFramework = this.options.hasFramework
        const isCheckingForUpdate = this.options.isCheckingForUpdate
        const isDownloadingUpdate = this.options.isDownloadingUpdate
        const hasDownloadedUpdate = this.options.hasDownloadedUpdate

        if (__DARWIN__) {
            template.push({
                label: 'Lode',
                submenu: [
                    {
                        label: 'About Lode',
                        click: emit('show-about')
                    },
                    {
                        label: isDownloadingUpdate
                            ? 'Downloading Update'
                            : (hasDownloadedUpdate ? 'Restart and Install Update' : 'Check for Updates…'),
                        enabled: process.env.NODE_ENV === 'production' && !isCheckingForUpdate && !isDownloadingUpdate,
                        click () {
                            if (hasDownloadedUpdate) {
                                autoUpdater.quitAndInstall()
                            }
                            autoUpdater.checkForUpdates()
                        }
                    },
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
                {
                    label: __DARWIN__ ? 'New Project' : 'New project',
                    accelerator: 'CmdOrCtrl+N',
                    click: emit('new-project')
                },
                {
                    label: __DARWIN__ ? 'Switch Project' : 'Switch project',
                    enabled: projects && projects.length > 1,
                    submenu: projects && projects.length > 1 ? projects.map(project => {
                        return {
                            label: project.name,
                            type: <MenuItemType>'checkbox',
                            checked: currentProject === project.id,
                            click: emit('switch-project', project.id, (menuItem: Electron.MenuItem) => {
                                // Don't toggle the item, unless it's the current project,
                                // as the switch might still be cancelled by the user. If
                                // switch project is confirmed, menu will be rebuilt anyway.
                                menuItem.checked = currentProject === project.id
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
                    label: '&Options…',
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
                { role: 'paste', label: __DARWIN__ ? 'Paste' : '&Paste' },
                {
                  label: __DARWIN__ ? 'Select All' : 'Select &all',
                  accelerator: 'CmdOrCtrl+A',
                  click: emit('select-all'),
                }
            ]
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
                    accelerator: 'CmdOrCtrl+0',
                    click(item: any, focusedWindow: Electron.BrowserWindow) {
                        if (focusedWindow) {
                            focusedWindow.reload()
                        }
                    },
                    visible: __DEV__
                }
            ]
        })

        template.push({
            label: __DARWIN__ ? 'Project' : '&Project',
            submenu: [
                {
                    label: __DARWIN__ ? 'Rename Project' : 'Rename project',
                    accelerator: 'CmdOrCtrl+Shift+E',
                    click: emit('rename-project')
                },
                {
                    label: __DARWIN__ ? 'Remove Project' : 'Remove project',
                    accelerator: 'CmdOrCtrl+Shift+Backspace',
                    click: emit('remove-project')
                },
                separator,
                {
                    label: __DARWIN__ ? 'Add Repositories… ' : 'Add repositories…',
                    click: emit('add-repositories')
                }
            ]
        })

        template.push({
            label: __DARWIN__ ? 'Framework' : '&Framework',
            submenu: [
                {
                    label: __DARWIN__ ? 'Refresh Framework' : 'Refresh framework',
                    click: emit('refresh-framework'),
                    accelerator: 'CmdOrCtrl+Shift+R',
                    enabled: hasFramework
                },
                {
                    label: __DARWIN__ ? 'Run Framework' : 'Run framework',
                    click: emit('run-framework'),
                    accelerator: 'CmdOrCtrl+R',
                    enabled: hasFramework
                },
                {
                    label: __DARWIN__ ? 'Stop Framework' : 'Stop framework',
                    click: emit('stop-framework'),
                    accelerator: (() => {
                        return __DARWIN__ ? 'Command+Esc' : 'Ctrl+Esc'
                    })(),
                    enabled: hasFramework
                },
                separator,
                {
                    label: __DARWIN__ ? 'Filter Suites…' : 'Filter suites…',
                    click: emit('filter'),
                    accelerator: (() => {
                        return __DARWIN__ ? 'Command+F' : 'Ctrl+F'
                    })(),
                    enabled: hasFramework
                },
                separator,
                {
                    label: __DARWIN__ ? 'Framework Settings…' : 'Framework settings…',
                    click: emit('framework-settings'),
                    enabled: hasFramework
                },
                {
                    label: __DARWIN__ ? 'Remove Framework' : 'Remove framework',
                    click: emit('remove-framework'),
                    enabled: hasFramework
                }
            ]
        })

        if (__DEV__) {
            template.push({
                label: __DARWIN__ ? 'Development' : '&Development',
                submenu: [
                    {
                        label: __DARWIN__ ? 'Log Project' : 'Log project',
                        click: emit('log-project')
                    },
                    {
                        label: __DARWIN__ ? 'Log Settings' : 'Log settings',
                        click: emit('log-settings')
                    },
                    separator,
                    {
                        label: __DARWIN__
                            ? 'Show User Data Folder in Finder'
                            : __WIN32__
                                ? 'S&how user data folder in Explorer'
                                : 'S&how user data folder in your File Manager',
                        click() {
                            const path = app.getPath('userData')
                            ensureDir(path)
                                .then(() => {
                                    shell.openItem(path)
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
                    },
                    separator,
                    {
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

        const helpItems = [
            // submitIssueItem,
            // contactSupportItem,
            // showUserGuides,
            separator,
            {
                label: __DARWIN__ ? 'Report a Problem or Feature Request' : 'Report a problem or feature request',
                click: emit('feedback')
            },
            separator,
            {
                label: 'Troubleshooting',
                submenu: [
                    {
                        label: __DARWIN__
                            ? 'Show Logs in Finder'
                            : __WIN32__
                                ? 'S&how logs in Explorer'
                                : 'S&how logs in your File Manager',
                        click() {
                            const path = getLogDirectoryPath()
                            ensureDir(path)
                                .then(() => {
                                    shell.openItem(path)
                                })
                                .catch(error => {
                                    log.error('Failed to opened logs directory from menu.', error)
                                })
                        }
                    },
                    {
                        label: __DARWIN__ ? 'Reset Settings…' : 'Reset settings…',
                        click: emit('reset-settings')
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
                    ...helpItems,
                    separator,
                    {
                        label: '&About Lode',
                        click: emit('show-about')
                    }
                ]
            })
        }

        Menu.setApplicationMenu(Menu.buildFromTemplate(template))
    }

    public build () {
        this.render()
    }

    public setOptions (options: any): void {
        this.options = {
            ...this.options,
            ...options
        }
        // Rebuild after options are updated.
        this.render()
    }
}

/**
 * Utility function returning a Click event handler which, when invoked, emits
 * the provided menu event over IPC.
 */
function emit(name: MenuEvent, properties?: any, callback?: Function): ClickHandler {
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
            })
        }
    }
}

export const applicationMenu = new ApplicationMenu()
