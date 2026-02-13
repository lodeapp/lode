import type {
    FrameworkFilter,
    FrameworkOptions,
    IFramework,
} from '@lib/frameworks/framework'
import type { Nugget } from '@lib/frameworks/nugget'

import type {
    IProject,
    ProjectActiveIdentifiers,
    ProjectEntities,
    ProjectIdentifier,
    ProjectOptions,
} from '@lib/frameworks/project'
import type { IRepository } from '@lib/frameworks/repository'
import type { ISuite } from '@lib/frameworks/suite'
import type { ITest } from '@lib/frameworks/test'
import type {
    PotentialFrameworkOptions,
    PotentialRepositoryOptions,
} from '@lib/frameworks/validator'
import type { LogLevel } from '@lib/logger/levels'
import type { ThemeName } from '@lib/themes'
import type {
    Menu as ContextMenu,
} from '@main/menu'
import Fs from 'node:fs'
import Path from 'node:path'
import { Frameworks } from '@lib/frameworks'
import {
    FrameworkValidator,
    RepositoryValidator,
} from '@lib/frameworks/validator'
import { log as writeLog } from '@lib/logger'
import { mergeEnvFromShell } from '@lib/process/shell'
import { SNAPSHOT_EXTENSION } from '@lib/snapshot/types'
import { state } from '@lib/state'
import { initializeTheme } from '@lib/themes'
import { ApplicationWindow } from '@main/application-window'
import { parseCliArgs, printHelp } from '@main/cli'
import { listProjects, removeProject, runHeadless } from '@main/headless'
import { runInit } from '@main/init'
import {
    applicationMenu,
    FileMenu,
    FrameworkMenu,
    ProjectMenu,
    RepositoryMenu,
    SnapshotSuiteMenu,
    SnapshotTestMenu,
    SuiteMenu,
    TestMenu,
} from '@main/menu'
import { Updater } from '@main/updater'
import { app, BrowserWindow, clipboard, dialog, ipcMain, nativeTheme, shell } from 'electron'
import { identity, isEmpty, pickBy } from 'lodash'
import '@lib/crash/reporter'
import '@lib/logger/main'

// Merge environment variables from the user's shell into the Electron
// process. GUI apps on macOS don't inherit the full shell environment,
// so without this, spawned processes can't find binaries like yarn/npm.
mergeEnvFromShell()

// Queue for snapshot files opened before app is ready (macOS open-file event)
let pendingSnapshotFile: string | null = null

// Parse CLI arguments early so non-GUI modes can skip GUI setup
let cliCommand
try {
    cliCommand = parseCliArgs()
}
catch (error) {
    // CLI parsing failed - show help and exit
    process.stderr.write(`Error: ${error instanceof Error ? error.message : String(error)}\n\n`)
    printHelp()
    process.exit(1)
}

// Non-GUI modes don't need a renderer, so disable GPU and suppress
// log noise (info/debug) so only stderr errors and our own stdout remain.
if (cliCommand.command !== 'gui' && cliCommand.command !== 'open') {
    app.disableHardwareAcceleration()
    const noop = () => {}
    ;(globalThis as any).log = {
        error: (globalThis as any).log.error,
        warn: noop,
        info: noop,
        debug: noop,
    } as ILogger
}

// Single instance lock: in GUI mode, ensure only one instance runs.
// If another instance is already running, forward our args to it and quit.
// Non-GUI modes skip this to allow concurrent CI runs.
if (cliCommand.command === 'gui') {
    const gotLock = app.requestSingleInstanceLock()
    if (!gotLock) {
        app.quit()
    }
    else {
        app.on('second-instance', (_event: Electron.Event, argv: string[]) => {
            // Parse the second instance's args to check for an open command
            try {
                const secondArgs = parseCliArgs(argv)
                if (secondArgs.command === 'open') {
                    const window = ApplicationWindow.createWindow(null)
                    window.setSnapshot(secondArgs.file)
                    applicationMenu.build(window)
                    return
                }
            }
            catch {
                // If parsing fails, just focus the primary window
            }
            // Otherwise, focus the primary window
            const focused = ApplicationWindow.getFocusedWindow()
            if (focused) {
                const child = focused.getChild()
                if (child.isMinimized()) {
                    child.restore()
                }
                child.focus()
            }
        })
    }
}

// Set `__static` path to static files in production
if (!__DEV__) {
    (globalThis as any).__static = Path.join(__dirname, '/static').replace(/\\/g, '\\\\')
}

function getProject(event: Electron.IpcMainEvent | Electron.IpcMainInvokeEvent): IProject {
    return ApplicationWindow.getProjectFromWebContents(event.sender)!
}

function isSnapshotWindow(event: Electron.IpcMainEvent | Electron.IpcMainInvokeEvent): boolean {
    const window = ApplicationWindow.getFromWebContents(event.sender)
    return window ? window.isSnapshotMode() : false
}

async function getRepository(event: Electron.IpcMainEvent | Electron.IpcMainInvokeEvent, repositoryId: string): Promise<IRepository> {
    const project: IProject = getProject(event)
    const repository: IRepository = project.getRepositoryById(repositoryId)!
    if (repository) {
        return repository!
    }
    log.error(`Error while getting repository ${repositoryId}.`)
    throw new Error(`Error while getting repository ${repositoryId}.`)
}

async function entities(
    event: Electron.IpcMainEvent | Electron.IpcMainInvokeEvent,
    frameworkId: string,
    identifiers: Array<string> = [],
): Promise<ProjectEntities> {
    try {
        const project: IProject = getProject(event)
        const context = project.getContextByFrameworkId(frameworkId)
        if (context) {
            const { repository, framework } = context
            const entities = { project, repository, framework }

            if (!identifiers.length) {
                return entities
            }
            let nugget: Nugget | undefined
            const nuggets: Array<Nugget> = []
            do {
                // First nugget is always a suite, all others are tests.
                nugget = nugget ? nugget.findTest(identifiers.shift()!) : framework.getSuiteById(identifiers.shift()!)
                if (!nugget) {
                    throw new Error('Nugget not found')
                }
                nuggets.push(nugget)
                if (!nugget.expanded) {
                    await nugget.toggleExpanded(true, false)
                }
            } while (identifiers.length > 0)

            return { ...entities, nuggets, nugget }
        }
    }
    catch (_) {}
    log.error(`Unable to find requested entities '${JSON.stringify({ frameworkId, identifiers })}'`)
    throw new Error(`Unable to find requested entities '${JSON.stringify({ frameworkId, identifiers })}'`)
}

app
    .on('ready', async () => {
        // Handle non-GUI commands first
        switch (cliCommand.command) {
            case 'help': {
                printHelp()
                app.exit(0)
                return
            }
            case 'list': {
                try {
                    const code = await listProjects(cliCommand.filter)
                    app.exit(code)
                }
                catch (error) {
                    process.stderr.write(`Error: ${(error as Error).message}\n`)
                    app.exit(2)
                }
                return
            }
            case 'remove': {
                try {
                    const code = removeProject(cliCommand.project)
                    app.exit(code)
                }
                catch (error) {
                    process.stderr.write(`Error: ${(error as Error).message}\n`)
                    app.exit(2)
                }
                return
            }
            case 'create': {
                try {
                    const code = await runInit(cliCommand)
                    app.exit(code)
                }
                catch (error) {
                    process.stderr.write(`Error: ${(error as Error).message}\n`)
                    app.exit(2)
                }
                return
            }
            case 'run': {
                try {
                    const code = await runHeadless(cliCommand)
                    app.exit(code)
                }
                catch (error) {
                    process.stderr.write(`Error: ${(error as Error).message}\n`)
                    app.exit(2)
                }
                return
            }
            default:
                break
        }

        // GUI modes: 'gui' and 'open'
        initializeTheme(state.get('theme'))

        // CLI open: open a snapshot file in a new window
        if (cliCommand.command === 'open') {
            const window = ApplicationWindow.createWindow(null)
            window.setSnapshot(cliCommand.file)
            applicationMenu.build(window)
            return
        }

        const openProjectIds: string[] = state.getOpenProjects()
        const currentProjectId = state.getCurrentProject()?.id || null
        let focusWindow: ApplicationWindow | null = null

        if (openProjectIds.length > 0) {
            // Session restore: re-open all previously open windows
            for (const projectId of openProjectIds) {
                const window = ApplicationWindow.createWindow({ id: projectId })
                if (projectId === currentProjectId) {
                    focusWindow = window
                }
            }
        }

        // If no windows were restored, open the current project, or the
        // first available one, or a blank window as a last resort.
        if (ApplicationWindow.getAllWindows().length === 0) {
            const fallback = state.getCurrentProject()
                || state.getAvailableProjects()[0]
                || null
            focusWindow = ApplicationWindow.createWindow(fallback)
        }

        const primaryWindow = focusWindow || ApplicationWindow.getAllWindows()[0]
        applicationMenu.build(primaryWindow)

        if (focusWindow) {
            focusWindow.getChild().focus()
        }

        // If a snapshot file was queued before the app was ready (macOS open-file), open it
        if (pendingSnapshotFile) {
            const snapshotWindow = ApplicationWindow.createWindow(null)
            snapshotWindow.setSnapshot(pendingSnapshotFile)
            applicationMenu.build(snapshotWindow)
            pendingSnapshotFile = null
        }

        if (!__DEV__) {
            // Start auto-updating process.
            // eslint-disable-next-line no-new -- Updater is instantiated for its side effects (auto-update)
            new Updater()
        }
    })
    .on('open-file', (event: Electron.Event, filePath: string) => {
        event.preventDefault()
        if (!filePath.endsWith(SNAPSHOT_EXTENSION)) {
            return
        }
        if (!app.isReady()) {
            pendingSnapshotFile = filePath
            return
        }
        const window = ApplicationWindow.createWindow(null)
        window.setSnapshot(filePath)
        applicationMenu.build(window)
    })
    .on('before-quit', () => {
        // Persist bounds for all windows (including snapshot) before quit,
        // while windows are still valid and not yet closed.
        const allWindows = ApplicationWindow.getAllWindows()
        for (const window of allWindows) {
            window.persistBounds()
        }
        // Only update the open-projects list if live (non-snapshot) windows
        // exist. Otherwise preserve the previously-saved list so session
        // restore works on next launch (e.g. quit from a read-only window).
        if (allWindows.some(w => !w.isSnapshotMode())) {
            ApplicationWindow.persistOpenProjects()
        }
    })
    .on('window-all-closed', () => {
        if (!__DARWIN__) {
            app.quit()
        }
    })
    .on('activate', () => {
        if (ApplicationWindow.getAllWindows().length === 0) {
            const window = ApplicationWindow.createWindow(state.getCurrentProject())
            applicationMenu.build(window)
        }
    })

ipcMain
    .on('log', (event: Electron.IpcMainEvent, level: LogLevel, message: string) => {
        // Write renderer messages to log, if they meet the level threshold.
        // We're using the main log function directly so that they are not
        // marked as being from the "main" process.
        writeLog(level, message)
    })
    .on('window-set', (event: any) => {
        // event is the ApplicationWindow itself (emitted directly, not via IPC)
        const window = event as ApplicationWindow
        applicationMenu.build(window)
        // Update currentProject to the focused window's project
        const project = window.getProject()
        if (project) {
            state.set('currentProject', project.getId())
        }
    })
    .on('maximize', (event: Electron.IpcMainEvent) => {
        const window = ApplicationWindow.getFromWebContents(event.sender)
        if (window) {
            const child = window.getChild()
            child.isMaximized() ? child.unmaximize() : child.maximize()
        }
    })
    .on('minimize', (event: Electron.IpcMainEvent) => {
        const window = ApplicationWindow.getFromWebContents(event.sender)
        if (window) {
            window.getChild().minimize()
        }
    })
    .on('close', (event: Electron.IpcMainEvent) => {
        const window = ApplicationWindow.getFromWebContents(event.sender)
        if (window) {
            window.getChild().close()
        }
    })
    .on('menu-refresh', (event: Electron.IpcMainEvent) => {
        const window = ApplicationWindow.getFromWebContents(event.sender)
        applicationMenu.build(window)
    })
    .on('menu-event', (event: any) => {
        // This handler is a fallback for when the menu emit() function
        // can't find a BrowserWindow to send to directly.
        const { name, properties, newWindow } = event as any
        const window = ApplicationWindow.getFocusedWindow()
        if (window) {
            window.sendMenuEvent({ name, properties, newWindow })
        }
    })
    .on('project-switch', (event: Electron.IpcMainEvent, identifier?: ProjectIdentifier | null) => {
        const window: ApplicationWindow = ApplicationWindow.getFromWebContents(event.sender)!
        const project: IProject | null = window.getProject()

        // If the target project is already open in another window, focus it instead
        if (identifier?.id) {
            const existing = ApplicationWindow.getByProjectId(identifier.id)
            if (existing && existing !== window) {
                existing.getChild().focus()
                return
            }
        }

        try {
            if (identifier && !isEmpty(pickBy(identifier, identity))) {
                window.setProject(identifier)
                state.set('currentProject', window.getProject()!.getId())
            }
            else {
                window.clear()
            }
            if (project) {
                project.stop()
            }
        }
        catch (error) {
            if (project) {
                window.setProject(project.getIdentifier())
                if (identifier && identifier.id) {
                    window.onProjectLoadingFailure(identifier.id)
                }
            }
        }
    })
    .on('project-open-in-new-window', (event: Electron.IpcMainEvent, identifier: ProjectIdentifier) => {
        // If the project is already open in a window, focus that window
        if (identifier.id) {
            const existing = ApplicationWindow.getByProjectId(identifier.id)
            if (existing) {
                existing.getChild().focus()
                return
            }
        }
        const newWindow = ApplicationWindow.createWindow(identifier)
        applicationMenu.build(newWindow)
    })
    .on('open-new-blank-window', (event: Electron.IpcMainEvent) => {
        const newWindow = ApplicationWindow.createWindow(null)
        // Once the new window's renderer is ready, auto-trigger project creation
        newWindow.getChild().webContents.once('did-finish-load', () => {
            newWindow.sendMenuEvent({ name: 'project-add' })
        })
    })
    .on('project-repositories', (event: Electron.IpcMainEvent, identifier: ProjectIdentifier) => {
        getProject(event).emitRepositoriesToRenderer()
    })
    .on('project-active-framework', (event: Electron.IpcMainEvent, frameworkId: ProjectActiveIdentifiers['framework']) => {
        const project = getProject(event)
        project.setActiveFramework(frameworkId)
        applicationMenu.setOptions(project.getActive())
    })
    .on('repository-remove', (event: Electron.IpcMainEvent, repositoryId: string) => {
        if (isSnapshotWindow(event)) {
            return
        }
        const project: IProject = getProject(event)
        project.removeRepository(repositoryId)
        project.emitRepositoriesToRenderer()
        ApplicationWindow.getFromWebContents(event.sender)!.refreshActiveFramework()
    })
    .on('repository-rename', async (event: Electron.IpcMainEvent, repositoryId: string, name: string) => {
        if (isSnapshotWindow(event)) {
            return
        }
        const repository = await getRepository(event, repositoryId)
        repository.setName(name)
        const project: IProject = getProject(event)
        project.emitRepositoriesToRenderer()
    })
    .on('repository-toggle', async (event: Electron.IpcMainEvent, repositoryId: string, toggle: boolean) => {
        const repository = await getRepository(event, repositoryId)
        if (toggle) {
            repository.expand()
            return
        }
        repository.collapse()
    })
    .on('framework-add', async (event: Electron.IpcMainEvent, repositoryId: string, options: FrameworkOptions) => {
        if (isSnapshotWindow(event)) {
            return
        }
        const repository: IRepository = await getRepository(event, repositoryId)
        repository.addFramework(options).then((framework) => {
            framework.refresh()
        })
        repository.emitFrameworksToRenderer()
        ApplicationWindow.getFromWebContents(event.sender)!.refreshActiveFramework()
    })
    .on('framework-remove', async (event: Electron.IpcMainEvent, frameworkId: string) => {
        if (isSnapshotWindow(event)) {
            return
        }
        entities(event, frameworkId).then(({ repository, framework }) => {
            repository.removeFramework(framework.getId())
            repository.emitFrameworksToRenderer()
            ApplicationWindow.getFromWebContents(event.sender)!.refreshActiveFramework()
        })
    })
    .on('framework-update', (event: Electron.IpcMainEvent, frameworkId: string, options: FrameworkOptions) => {
        if (isSnapshotWindow(event)) {
            return
        }
        entities(event, frameworkId).then(async ({ repository, framework }) => {
            await framework.updateOptions({
                ...options,
                repositoryPath: repository.getPath(),
            })
            repository.emitFrameworksToRenderer()
            event.sender.send('framework-options-updated', framework.render())
            framework.emitSuitesToRenderer()
        })
    })
    .on('framework-refresh', (event: Electron.IpcMainEvent, frameworkId: string) => {
        if (isSnapshotWindow(event)) {
            return
        }
        entities(event, frameworkId).then(({ framework }) => {
            framework.refresh()
        })
    })
    .on('framework-start', (event: Electron.IpcMainEvent, frameworkId: string) => {
        if (isSnapshotWindow(event)) {
            return
        }
        entities(event, frameworkId).then(({ framework }) => {
            framework.start()
        })
    })
    .on('framework-stop', (event: Electron.IpcMainEvent, frameworkId: string) => {
        if (isSnapshotWindow(event)) {
            return
        }
        entities(event, frameworkId).then(({ framework }) => {
            framework.stop()
        })
    })
    .on('framework-suites', (event: Electron.IpcMainEvent, frameworkId: string) => {
        entities(event, frameworkId).then(({ framework }) => {
            framework.emitSuitesToRenderer()
        })
    })
    .on('framework-filter', (event: Electron.IpcMainEvent, frameworkId: string, key: FrameworkFilter, value: any) => {
        entities(event, frameworkId).then(({ framework }) => {
            framework.setFilter(key, value)
        })
    })
    .on('framework-reset-filters', (event: Electron.IpcMainEvent, frameworkId: string) => {
        entities(event, frameworkId).then(({ framework }) => {
            framework.resetFilters()
        })
    })
    .on('framework-toggle-child', async (event: Electron.IpcMainEvent, frameworkId: string, identifiers: Array<string>, toggle: boolean) => {
        entities(event, frameworkId, identifiers).then(({ nugget }) => {
            if (toggle) {
                // If we're expanding it, send the tests to the renderer.
                nugget!.emitTestsToRenderer()
                return
            }
            // If collapsing, just wither the nugget, no response is needed.
            nugget!.toggleExpanded(false, true)
        })
    })
    .on('framework-collapse-all', async (event: Electron.IpcMainEvent, frameworkId: string, identifiers: Array<string>, toggle: boolean) => {
        entities(event, frameworkId, identifiers).then(({ framework }) => {
            framework.getAllSuites().forEach((nugget: ISuite) => {
                nugget.toggleExpanded(false, true)
            })
        })
    })
    .on('framework-select', async (event: Electron.IpcMainEvent, frameworkId: string, identifiers: Array<string>, toggle: boolean) => {
        if (isSnapshotWindow(event)) {
            return
        }
        entities(event, frameworkId, identifiers).then(({ nugget }) => {
            nugget!.toggleSelected(toggle, true)
        })
    })
    .on('nugget-context-menu', async (event: Electron.IpcMainEvent, frameworkId: string, identifiers: Array<string>) => {
        const snapshot = isSnapshotWindow(event)
        entities(event, frameworkId, identifiers).then(({ nuggets }) => {
            if (nuggets) {
                if (nuggets.length === 1) {
                    const suite = nuggets.pop() as ISuite
                    ;(snapshot
                        ? new SnapshotSuiteMenu(suite, event.sender)
                        : new SuiteMenu(suite, event.sender)
                    ).open()
                }
                else {
                    const suite = nuggets.shift() as ISuite
                    const test = nuggets.pop() as ITest
                    ;(snapshot
                        ? new SnapshotTestMenu(suite, test, event.sender)
                        : new TestMenu(suite, test, event.sender)
                    ).open()
                }
            }
        })
    })
    .on('open-test', async (event: Electron.IpcMainEvent, frameworkId: string, identifiers: Array<string>) => {
        entities(event, frameworkId, identifiers).then(({ nuggets }) => {
            if (nuggets && nuggets.length) {
                const suite = nuggets.shift() as ISuite

                if (!suite || !suite.canBeOpened()) {
                    return
                }

                suite.open()
            }
        })
    })
    .on('select-all', (event: Electron.IpcMainEvent) => {
        event.sender.selectAll()
    })
    .on('set-theme', (event: Electron.IpcMainEvent, theme: ThemeName) => {
        nativeTheme.themeSource = theme
    })
    .on('settings-update', (event: Electron.IpcMainEvent, setting: string, value: any) => {
        state.set(setting, value)
        event.sender.send('settings-updated', state.get())
    })
    .on('settings-reset', async (event: Electron.IpcMainEvent) => {
        await state.reset()
        const window: ApplicationWindow | null = ApplicationWindow.getFromWebContents(event.sender)
        if (window) {
            window.clear()
            window.reload()
        }
    })
    .on('copy-to-clipboard', async (event: Electron.IpcMainEvent, string: string) => {
        clipboard.writeText(string)
    })
    .on('open-external-link', async (event: Electron.IpcMainEvent, link: string) => {
        shell.openExternal(link)
    })

ipcMain
    .handle('project-remove', async (event: Electron.IpcMainInvokeEvent, id: string) => {
        return state.removeProject(id)
    })

ipcMain
    .handle('project-update', async (event: Electron.IpcMainInvokeEvent, options: ProjectOptions) => {
        if (isSnapshotWindow(event)) {
            return null
        }
        const project: IProject | null = ApplicationWindow.getProjectFromWebContents(event.sender)
        if (project) {
            project.updateOptions(options)
            return project.render()
        }
        return null
    })

ipcMain
    .handle('project-empty-repositories', async (event: Electron.IpcMainInvokeEvent) => {
        return getProject(event).getEmptyRepositories().map(repository => repository.render())
    })

ipcMain
    .handle('project-add-repositories-menu', async (event: Electron.IpcMainInvokeEvent) => {
        return (await dialog.showOpenDialog(BrowserWindow.fromWebContents(event.sender)!, {
            properties: ['openDirectory', 'multiSelections'],
        })).filePaths
    })

ipcMain
    .handle('project-context-menu', async (event: Electron.IpcMainInvokeEvent): Promise<void> => {
        return new Promise((resolve) => {
            new ProjectMenu(getProject(event), event.sender)
                .after(() => {
                    resolve()
                })
                .open()
        })
    })

ipcMain
    .handle('repository-add', async (event: Electron.IpcMainInvokeEvent, paths: Array<string>) => {
        if (isSnapshotWindow(event)) {
            return []
        }
        const project: IProject = getProject(event)
        const repositories = await Promise.all(paths.map((path) => {
            return project.addRepository({ path })
        }))
        project.emitRepositoriesToRenderer()
        return repositories.map(repository => repository.render())
    })

ipcMain
    .handle('repository-scan', async (event: Electron.IpcMainInvokeEvent, repositoryId: string) => {
        return await (await getRepository(event, repositoryId)).scan()
    })

ipcMain
    .handle('repository-validate', async (event: Electron.IpcMainInvokeEvent, options: PotentialRepositoryOptions) => {
        const project: IProject = getProject(event)
        const validator = new RepositoryValidator(project.repositories.map((repository: IRepository) => repository.getPath()))
        return validator.validate(options).getErrors()
    })

ipcMain
    .handle('repository-exists', async (event: Electron.IpcMainInvokeEvent, repositoryId: string) => {
        return await (await getRepository(event, repositoryId)).exists()
    })

ipcMain
    .handle('repository-locate', async (event: Electron.IpcMainInvokeEvent, repositoryId: string) => {
        return (await getRepository(event, repositoryId)).locate(BrowserWindow.fromWebContents(event.sender)!)
    })

ipcMain
    .handle('repository-frameworks', async (event: Electron.IpcMainInvokeEvent, repositoryId: string) => {
        return (await getRepository(event, repositoryId)).frameworks.map(framework => framework.render())
    })

ipcMain
    .handle('repository-branch', async (event: Electron.IpcMainInvokeEvent, repositoryId: string) => {
        return (await getRepository(event, repositoryId)).getBranch()
    })

ipcMain
    .handle('repository-context-menu', async (event: Electron.IpcMainInvokeEvent, repositoryId: string): Promise<void> => {
        const repository: IRepository = await getRepository(event, repositoryId)
        return new Promise((resolve) => {
            new RepositoryMenu(repository, event.sender)
                .after(() => {
                    resolve()
                })
                .open()
        })
    })

ipcMain
    .handle('framework-types', async (event: Electron.IpcMainInvokeEvent) => {
        return Frameworks.map((framework) => {
            return {
                ...framework.getDefaults(),
                instructions: framework.instructions(),
            }
        })
    })

ipcMain
    .handle('framework-get', async (event: Electron.IpcMainInvokeEvent, frameworkId: string) => {
        const { framework } = await entities(event, frameworkId)
        return framework.render()
    })

ipcMain
    .handle('framework-get-ledger', async (event: Electron.IpcMainInvokeEvent, frameworkId: string) => {
        const { framework } = await entities(event, frameworkId)
        return {
            ledger: framework.getLedger(),
            status: framework.getStatusMap(),
        }
    })

ipcMain
    .handle('framework-validate', async (event: Electron.IpcMainInvokeEvent, repositoryId: string, options: PotentialFrameworkOptions) => {
        const repository: IRepository = await getRepository(event, repositoryId)
        const validator = new FrameworkValidator(repository.getPath())
        return validator.validate(options).getErrors()
    })

ipcMain
    .handle('framework-autoload-path-menu', async (event: Electron.IpcMainInvokeEvent, defaultPath: string) => {
        return (await dialog.showOpenDialog(BrowserWindow.fromWebContents(event.sender)!, {
            properties: ['openFile'],
            defaultPath,
        })).filePaths
    })

ipcMain
    .handle('framework-tests-path-menu', async (event: Electron.IpcMainInvokeEvent, defaultPath: string) => {
        return (await dialog.showOpenDialog(BrowserWindow.fromWebContents(event.sender)!, {
            properties: ['createDirectory', 'openDirectory'],
            defaultPath,
        })).filePaths
    })

ipcMain
    .handle('framework-identity-menu', async (event: Electron.IpcMainInvokeEvent) => {
        return (await dialog.showOpenDialog(BrowserWindow.fromWebContents(event.sender)!, {
            properties: ['openFile', 'showHiddenFiles'],
            message: 'Choose a custom SSH key file to use with this connection.\nNote that ~/.ssh/id_rsa and identities defined in your SSH configuration are included by default.',
        })).filePaths
    })

ipcMain
    .handle('framework-context-menu', async (event: Electron.IpcMainInvokeEvent, frameworkId: string, rect?: DOMRect): Promise<void> => {
        const { repository, framework } = await entities(event, frameworkId)
        return new Promise((resolve) => {
            new FrameworkMenu(repository, framework, event.sender)
                .attachTo(rect)
                .after(() => {
                    resolve()
                })
                .open()
        })
    })

ipcMain
    .handle('test-get', async (event: Electron.IpcMainInvokeEvent, frameworkId: string, identifiers: Array<string>) => {
        try {
            const { repository, framework, nuggets, nugget } = await entities(event, frameworkId, identifiers)
            return {
                repository: repository.render(),
                framework: framework.render(),
                nuggets: nuggets!.map((nugget: Nugget) => nugget.render(false)),
                nugget: nugget!.render(false),
                results: {
                    ...(nugget as ITest)!.getResult(),
                    'suite-console': (nuggets![0] as ISuite).getConsole(),
                },
            }
        }
        catch (_) {
            // If any entity is not found while trying to load a test, assume
            // something's been removed and force the user to select one again.
            return {}
        }
    })

ipcMain
    .handle('test-feedback-text', async (event: Electron.IpcMainInvokeEvent, text: string) => {
        const project: IProject = getProject(event)
        const framework: IFramework | null = project.getActive().framework
        if (framework) {
            return framework.processFeedbackText(text)
        }

        return text
    })

ipcMain
    .handle('file-context-menu', async (event: Electron.IpcMainInvokeEvent, filePath: string): Promise<void> => {
        return new Promise((resolve) => {
            new FileMenu(filePath, event.sender)
                .after(() => {
                    resolve()
                })
                .open()
        })
    })

ipcMain
    .handle('titlebar-menu', (event: Electron.IpcMainInvokeEvent, item: string, rect: DOMRect): void => {
        const menu: ContextMenu = applicationMenu.getSection(item)
        if (!menu) {
            return
        }
        menu
            .attachTo(rect, false)
            .after(() => {
                event.sender.send('titlebar-menu-closed', item)
            })
            .open()
    })

ipcMain
    .handle('terms', async (event: Electron.IpcMainInvokeEvent) => {
        return Fs.readFileSync(Path.join(__static, '/LICENSE'), 'utf8') || ''
    })

ipcMain
    .handle('licenses', async (event: Electron.IpcMainInvokeEvent) => {
        return Fs.readFileSync(Path.join(__static, '/licenses.json'), 'utf8')
    })

ipcMain
    .handle('log-project', async (event: Electron.IpcMainInvokeEvent) => {
        const project: IProject = getProject(event)
        const projectState = state.project({ id: project.getId() })
        return {
            object: projectState.get(),
            string: JSON.stringify(projectState.get()),
        }
    })

ipcMain
    .handle('log-settings', async (event: Electron.IpcMainInvokeEvent) => {
        return {
            object: state.get(),
            string: JSON.stringify(state.get()),
        }
    })

ipcMain
    .handle('snapshot-open-dialog', async (event: Electron.IpcMainInvokeEvent) => {
        return (await dialog.showOpenDialog(BrowserWindow.fromWebContents(event.sender)!, {
            properties: ['openFile'],
            filters: [
                { name: 'Lode Results', extensions: [SNAPSHOT_EXTENSION.replace('.', '')] },
            ],
        })).filePaths
    })

ipcMain
    .on('snapshot-load', (event: Electron.IpcMainEvent, filePath: string) => {
        const window = ApplicationWindow.getFromWebContents(event.sender)
        if (!window) {
            return
        }
        window.setSnapshot(filePath)
    })

ipcMain
    .on('snapshot-open-in-new-window', (event: Electron.IpcMainEvent, filePath: string) => {
        const window = ApplicationWindow.createWindow(null)
        window.setSnapshot(filePath)
        applicationMenu.build(window)
    })

ipcMain
    .on('snapshot-reveal-file', (event: Electron.IpcMainEvent) => {
        const window = ApplicationWindow.getFromWebContents(event.sender)
        if (!window) {
            return
        }
        const filePath = window.getSnapshotFilePath()
        if (filePath) {
            shell.showItemInFolder(filePath)
        }
    })
