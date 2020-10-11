import '@lib/crash/reporter'
import '@lib/logger/main'
import '@lib/tracker/main'

import Fs from 'fs'
import { stringify } from 'flatted'
import { app, ipcMain, shell } from 'electron'
import { applicationMenu } from './menu'
import { Window } from './window'
import { Updater } from './updater'
import { send } from './ipc'
import { openDirectorySafe } from './shell'
import { LogLevel } from '@lib/logger/levels'
import { mergeEnvFromShell } from '@lib/process/shell'
import { state } from '@lib/state'
import { log as writeLog } from '@lib/logger'
import { ProjectIdentifier, ProjectEntities, IProject } from '@lib/frameworks/project'
import { IRepository } from '@lib/frameworks/repository'
import {
    FrameworkContext,
    IFramework,
    FrameworkOptions,
    FrameworkFilter
} from '@lib/frameworks/framework'
import { Nugget } from '@lib/frameworks/nugget'
import { ISuite } from '@lib/frameworks/suite'
import { ITest } from '@lib/frameworks/test'
import {
    PotentialRepositoryOptions,
    RepositoryValidator,
    FrameworkValidator,
    PotentialFrameworkOptions
} from '@lib/frameworks/validator'
import { FrameworkSort } from '@lib/frameworks/sort'

let currentWindow: Window | null = null

// Merge environment variables from shell, if needed.
mergeEnvFromShell()

// Set `__static` path to static files in production
if (process.env.NODE_ENV !== 'development') {
    (global as any).__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
} else {
    // Check for special development scripts (e.g. migrations)
    const argv = process.argv.slice(3)
    if (argv.length) {
        if (argv[0] === 'migrate') {
            if (argv[1] === 'down') {
                state.migrateDownTo()
            } else if (argv[1] === 'up') {
                state.migrateUpTo()
            }
        }
        process.exit()
    }
}

function getProject (event: Electron.IpcMainEvent | Electron.IpcMainInvokeEvent): IProject {
    return Window.getProjectFromWebContents(event.sender)!
}

function getRepository (event: Electron.IpcMainEvent | Electron.IpcMainInvokeEvent, repositoryId: string): Promise<IRepository> {
    return new Promise(async (resolve, reject) => {
        const project: IProject = getProject(event)
        const repository: IRepository = project.getRepositoryById(repositoryId)!
        if (repository) {
            resolve(repository!)
            return
        }
        log.error(`Error while getting repository ${repositoryId}.`)
        reject()
    })
}

function entities (
    event: Electron.IpcMainEvent | Electron.IpcMainInvokeEvent,
    context: FrameworkContext,
    identifiers: Array<string> = []
): Promise<ProjectEntities> {
    return new Promise(async (resolve, reject) => {
        try {
            const project: IProject = getProject(event)
            const repository: IRepository | undefined = project.getRepositoryById(context.repository)
            if (repository) {
                const framework: IFramework | undefined = repository.getFrameworkById(context.framework)
                if (framework) {
                    const entities = { project, repository, framework }
                    if (!identifiers.length) {
                        resolve(entities)
                        return
                    }
                    let nugget: Nugget | undefined
                    const nuggets: Array<Nugget> = []
                    do {
                        // First nugget is always a suite, all others are tests.
                        nugget = nugget ? nugget.findTest(identifiers.shift()!) : framework.getSuiteById(identifiers.shift()!)
                        if (!nugget) {
                            throw Error
                        }
                        nuggets.push(nugget)
                        if (!nugget.expanded) {
                            await nugget.toggleExpanded(true, false)
                        }
                    } while (identifiers.length > 0)
                    resolve({ ...entities, nuggets, nugget })
                    return
                }
            }
        } catch (_) {}
        log.error(`Unable to find requested entities '${JSON.stringify({ context, identifiers })}'`)
        reject()
    })
}

app
    .on('ready', () => {
        // @TODO: re-enable CSP once we figure out how to do it in Electron 10+
        // session!.defaultSession!.webRequest.onHeadersReceived((details, callback) => {
        //     callback({
        //         responseHeaders: {
        //             ...details.responseHeaders,
        //             'Content-Security-Policy': [compact([
        //                 'default-src \'self\'',
        //                 process.env.NODE_ENV === 'development' ? 'style-src \'self\' \'unsafe-inline\'' : ''
        //             ]).join('; ')]
        //         }
        //     })
        // })

        track.screenview('Application started')
        currentWindow = Window.init(state.getCurrentProject())
        applicationMenu.build(currentWindow)

        if (!__DEV__) {
            // Start auto-updating process.
            new Updater()
        }
    })

ipcMain
    .on('log', (event: Electron.IpcMainEvent, level: LogLevel, message: string) => {
        // Write renderer messages to log, if they meet the level threshold.
        // We're using the main log function directly so that they are not
        // marked as being from the "main" process.
        writeLog(level, message)
    })
    .on('window-set', (event: Electron.IpcMainEvent, args: any[]) => {
        currentWindow = event as any
    })
    .on('menu-refresh', (event: Electron.IpcMainEvent) => {
        applicationMenu.build(currentWindow)
    })
    .on('menu-set-options', (event: Electron.IpcMainEvent, options: any) => {
        applicationMenu.setOptions(options)
    })
    .on('menu-event', (event: Electron.IpcMainEvent, args: any[]) => {
        const { name, properties } = event as any
        console.log('MENU EVENT', { currentWindow, name, properties })
        if (currentWindow) {
            currentWindow.sendMenuEvent({ name, properties })
        }
    })
    .on('project-refresh', (event: Electron.IpcMainEvent) => {
        getProject(event).refresh()
    })
    .on('project-start', (event: Electron.IpcMainEvent) => {
        getProject(event).start()
    })
    .on('project-stop', (event: Electron.IpcMainEvent) => {
        getProject(event).stop()
    })
    .on('project-switch', (event: Electron.IpcMainEvent, identifier: ProjectIdentifier | null) => {
        const window: Window = Window.getFromWebContents(event.sender)
        const project: IProject | null = window.getProject()
        console.log('SWITCHING', identifier)
        if (identifier) {
            window.setProject(identifier)
            state.set('currentProject', window.getProject()!.getId())
        } else {
            window.clear()
        }
        if (project) {
            project.stop()
        }
    })
    .on('project-repositories', (event: Electron.IpcMainEvent, identifier: ProjectIdentifier) => {
        send(event.sender, 'repositories', [
            getProject(event).repositories.map((repository: IRepository) => repository.render())
        ])
    })
    .on('project-active-framework', (event: Electron.IpcMainEvent, frameworkId: string) => {
        getProject(event).setActiveFramework(frameworkId)
    })
    .on('repository-add', (event: Electron.IpcMainEvent, paths: Array<string>) => {
        const project: IProject = getProject(event)
        Promise.all(paths.map(path => {
            return project.addRepository({ path })
        })).then(repositories => {
            send(event.sender, 'repository-added', [repositories.map(repository => repository.render())])
            send(event.sender, 'repositories', [project.repositories.map((repository: IRepository) => repository.render())])
        })
    })
    .on('repository-remove', (event: Electron.IpcMainEvent, repositoryId: string) => {
        const project: IProject = getProject(event)
        project.removeRepository(repositoryId)
        send(event.sender, 'repositories', [project.repositories.map((repository: IRepository) => repository.render())])
        Window.getFromWebContents(event.sender).refreshActiveFramework()
    })
    .on('repository-scan', async (event: Electron.IpcMainEvent, repositoryId: string) => {
        const repository: IRepository = await getRepository(event, repositoryId)
        const pending: Array<FrameworkOptions> = await repository.scan()
        send(event.sender, `${repositoryId}:repository-scanned`, [pending])
    })
    .on('repository-refresh', async (event: Electron.IpcMainEvent, repositoryId: string) => {
        (await getRepository(event, repositoryId)).refresh()
    })
    .on('repository-start', async (event: Electron.IpcMainEvent, repositoryId: string) => {
        (await getRepository(event, repositoryId)).start()
    })
    .on('repository-stop', async (event: Electron.IpcMainEvent, repositoryId: string) => {
        (await getRepository(event, repositoryId)).stop()
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
        const repository: IRepository = await getRepository(event, repositoryId)
        repository.addFramework(options).then(framework => {
            framework.refresh()
        })
        send(event.sender, `${repository.getId()}:frameworks`, [repository.frameworks.map(framework => framework.render())])
        Window.getFromWebContents(event.sender).refreshActiveFramework()
    })
    .on('framework-remove', async (event: Electron.IpcMainEvent, context: FrameworkContext) => {
        entities(event, context).then(({ repository, framework }) => {
            repository.removeFramework(framework.getId())
            send(event.sender, `${repository.getId()}:frameworks`, [repository.frameworks.map(framework => framework.render())])
            Window.getFromWebContents(event.sender).refreshActiveFramework()
        })
    })
    .on('framework-update', (event: Electron.IpcMainEvent, context: FrameworkContext, options: FrameworkOptions) => {
        entities(event, context).then(({ repository, framework }) => {
            framework.updateOptions({
                ...options,
                repositoryPath: repository.getPath()
            })
            send(event.sender, `${repository.getId()}:frameworks`, [repository.frameworks.map(framework => framework.render())])
            send(event.sender, 'framework-options-updated', [framework.render()])
        })
    })
    .on('framework-refresh', (event: Electron.IpcMainEvent, context: FrameworkContext) => {
        entities(event, context).then(({ framework }) => {
            framework.refresh()
        })
    })
    .on('framework-start', (event: Electron.IpcMainEvent, context: FrameworkContext) => {
        entities(event, context).then(({ framework }) => {
            framework.start()
        })
    })
    .on('framework-stop', (event: Electron.IpcMainEvent, context: FrameworkContext) => {
        entities(event, context).then(({ framework }) => {
            framework.stop()
        })
    })
    .on('framework-suites', (event: Electron.IpcMainEvent, context: FrameworkContext) => {
        entities(event, context).then(({ framework }) => {
            send(
                event.sender,
                `${framework.getId()}:refreshed`,
                [framework.getSuites().map((suite: ISuite) => suite.render(false))]
            )
        })
    })
    .on('framework-filter', (event: Electron.IpcMainEvent, context: FrameworkContext, key: FrameworkFilter, value: any) => {
        entities(event, context).then(({ framework }) => {
            framework.setFilter(key, value)
            send(
                event.sender,
                `${framework.getId()}:refreshed`,
                [framework.getSuites().map((suite: ISuite) => suite.render(false))]
            )
        })
    })
    .on('framework-sort', (event: Electron.IpcMainEvent, context: FrameworkContext, sort: FrameworkSort) => {
        entities(event, context).then(({ repository, framework }) => {
            console.log('SETTING SORT', sort)
            framework.setSort(sort)
            send(event.sender, 'framework-updated', [framework.render()])
            send(event.sender, `${repository.getId()}:frameworks`, [repository.frameworks.map(framework => framework.render())])
            send(
                event.sender,
                `${framework.getId()}:refreshed`,
                [framework.getSuites().map((suite: ISuite) => suite.render(false))]
            )
        })
    })
    .on('framework-sort-reverse', (event: Electron.IpcMainEvent, context: FrameworkContext) => {
        entities(event, context).then(({ repository, framework }) => {
            framework.setSortReverse()
            send(event.sender, 'framework-updated', [framework.render()])
            send(event.sender, `${repository.getId()}:frameworks`, [repository.frameworks.map(framework => framework.render())])
            send(
                event.sender,
                `${framework.getId()}:refreshed`,
                [framework.getSuites().map((suite: ISuite) => suite.render(false))]
            )
        })
    })
    .on('framework-toggle-child', async (event: Electron.IpcMainEvent, context: FrameworkContext, identifiers: Array<string>, toggle: boolean) => {
        entities(event, context, identifiers).then(({ nugget }) => {
            if (toggle) {
                // If we're expanding it, send the tests to the renderer.
                console.log('SENDING TESTS', [nugget!.tests.map((test: ITest) => test.render(false).status)])
                send(
                    event.sender,
                    `${nugget!.getId()}:framework-tests`,
                    [nugget!.tests.map((test: ITest) => test.render(false))]
                )
                return
            }
            // If collapsing, just wither the nugget, no response is needed.
            nugget!.toggleExpanded(false, true)
        })
    })
    .on('framework-select', async (event: Electron.IpcMainEvent, context: FrameworkContext, identifiers: Array<string>, toggle: boolean) => {
        entities(event, context, identifiers).then(({ nugget }) => {
            nugget!.toggleSelected(toggle, true)
        })
    })
    .on('settings-update', (event: Electron.IpcMainEvent, setting: string, value: any) => {
        console.log('handling settings update')
        state.set(setting, value)
        send(event.sender, 'settings-updated', [state.get()])
    })
    .on('settings-reset', (event: Electron.IpcMainEvent) => {
        state.reset()
        const window: Window = Window.getFromWebContents(event.sender)
        window.clear()
        window.reload()
    })
    .on('check-if-file-exists', (event: Electron.IpcMainEvent, path: string) => {
        send(event.sender, `${path}:exists`, [Fs.existsSync(path)])
    })
    .on('show-item-in-folder', (event: Electron.IpcMainEvent, path: string) => {
        Fs.stat(path, (err, stats) => {
            if (err) {
                log.error(`Unable to find file at '${path}'`, err)
                return
            }

            if (!__DARWIN__ && stats.isDirectory()) {
                openDirectorySafe(path)
            } else {
                shell.showItemInFolder(path)
            }
        })
    })

ipcMain
    .handle('project-remove', async (event: Electron.IpcMainInvokeEvent) => {
        const project: IProject = getProject(event)
        await project.stop()
        return state.removeProject(project.getId())
    })

ipcMain
    .handle('project-empty-repositories', async (event: Electron.IpcMainInvokeEvent) => {
        return JSON.stringify(getProject(event).getEmptyRepositories())
    })

ipcMain
    .handle('repository-validate', async (event: Electron.IpcMainInvokeEvent, options: PotentialRepositoryOptions) => {
        const project: IProject = getProject(event)
        const validator = new RepositoryValidator(project.repositories.map((repository: IRepository) => repository.getPath()))
        return JSON.stringify(validator.validate(options).getErrors())
    })

ipcMain
    .handle('repository-frameworks', async (event: Electron.IpcMainInvokeEvent, repositoryId: string) => {
        return JSON.stringify((await getRepository(event, repositoryId)).frameworks.map(framework => framework.render()))
    })

ipcMain
    .handle('framework-get', async (event: Electron.IpcMainInvokeEvent, context: FrameworkContext) => {
        const { framework } = await entities(event, context)
        return JSON.stringify(framework.render())
    })

ipcMain
    .handle('framework-validate', async (event: Electron.IpcMainInvokeEvent, repositoryId: string, options: PotentialFrameworkOptions) => {
        const repository: IRepository = await getRepository(event, repositoryId)
        const validator = new FrameworkValidator(repository.getPath())
        return JSON.stringify(validator.validate(options).getErrors())
    })

ipcMain
    .handle('log-project', async (event: Electron.IpcMainInvokeEvent) => {
        const project: IProject = getProject(event)
        const projectState = state.project({ id: project.getId() })
        return stringify({
            project: {
                object: project,
                string: stringify(project)
            },
            state: {
                json: projectState.get(),
                string: stringify(projectState.get())
            }
        })
    })

ipcMain
    .handle('log-settings', async (event: Electron.IpcMainInvokeEvent) => {
        return stringify({
            object: state.get(),
            string: stringify(state.get())
        })
    })
