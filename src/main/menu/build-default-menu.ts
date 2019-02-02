import { Menu, ipcMain } from 'electron'
import { ensureItemIds } from './ensure-item-ids'
import { MenuEvent } from './menu-event'
import { Config } from '@lib/config'

// import { log } from '../log'
// import { ensureDir } from 'fs-extra'
// import { openDirectorySafe } from '../shell'

// We seem to be unable to simple declare menu items as "radio" without TS
// raising an alert, so we need to forcibly cast types when defining them.
type MenuItemType = ('normal' | 'separator' | 'submenu' | 'checkbox' | 'radio')

export type ProjectSettings = {
    id: string
    name: string
}

export type ApplicationMenuOptions = {
    latestJobName?: string
}

export function buildDefaultMenu (options: ApplicationMenuOptions = {}): Electron.Menu {
    const template = new Array<Electron.MenuItemConstructorOptions>()
    const separator: Electron.MenuItemConstructorOptions = { type: 'separator' }

    const currentProject: string = Config.get('currentProject')
    const projects: Array<ProjectSettings> = Config.get('projects')

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
            {
                label: __DARWIN__ ? 'New Project…' : 'New project…',
                id: 'new-project',
                accelerator: 'CmdOrCtrl+N',
                click: emit('new-project')
            },
            {
                label: __DARWIN__ ? 'Switch Project' : 'Switch project',
                id: 'switch-project',
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
                id: 'reload-window',
                accelerator: 'CmdOrCtrl+R',
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
                label: 'Run',
                click: emit('run-project'),
                accelerator: 'CmdOrCtrl+Shift+D'
            },
            {
                label: 'Refresh',
                click: emit('refresh-project'),
                accelerator: 'CmdOrCtrl+Shift+R'
            },
            {
                label: 'Stop',
                click: emit('stop-project'),
                accelerator: (() => {
                    return __DARWIN__ ? 'Command+Esc' : 'Ctrl+Esc'
                })(),
            },
            separator,
            {
                label: 'Repeat Last Run',
                click: emit('rerun-last'),
                accelerator: 'CmdOrCtrl+D',
                enabled: !!options.latestJobName
            },
            {
                label: options.latestJobName || 'Nothing has been run',
                enabled: false
            },
            separator,
            {
                id: 'rename-project',
                label: __DARWIN__ ? 'Rename…' : 'Rename…',
                click: emit('rename-project')
            },
            {
                id: 'remove-project',
                label: __DARWIN__ ? 'Remove…' : 'Remove…',
                click: emit('remove-project')
            },
            separator,
            {
                id: 'add-repositories',
                label: __DARWIN__ ? 'Add Repositories… ' : 'Add repositories…',
                accelerator: 'CmdOrCtrl+O',
                click: emit('add-repositories')
            }
        ]
    })

    if (__DEV__) {
        template.push({
            label: __DARWIN__ ? 'Development' : '&Development',
            submenu: [
                {
                    label: __DARWIN__ ? 'Log Settings' : 'Log settings',
                    click: emit('log-settings')
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
                    click: emit('boomtown'),
                },
                separator,
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
        separator,
        {
            label: __DARWIN__ ? 'Report a Problem or Feature Request' : 'Report a problem or feature request',
            click: emit('feedback')
        },
        separator,
        {
            label: __DARWIN__ ? 'Reset Settings…' : 'Reset settings…',
            click: emit('reset-settings')
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
                    click: emit('show-about'),
                    id: 'about'
                }
            ]
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
