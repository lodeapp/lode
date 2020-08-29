import '@lib/crash/reporter'
import '@lib/logger/main'
import '@lib/tracker/main'

import Fs from 'fs'
import { compact } from 'lodash'
import { app, ipcMain, session, shell } from 'electron'
import { applicationMenu } from './menu'
import { BrowserWindow, Window } from './window'
import { Updater } from './updater'
import { openDirectorySafe } from './shell'
import { LogLevel } from '@lib/logger/levels'
import { mergeEnvFromShell } from '@lib/process/shell'
import { state } from '@lib/state'
import { log as writeLog } from '@lib/logger'
import { ProjectIdentifier, ProjectEntities, IProject } from '@lib/frameworks/project'
import { IRepository } from '@lib/frameworks/repository'
import { FrameworkContext, IFramework, FrameworkOptions } from '@lib/frameworks/framework'
import { Nugget } from '@lib/frameworks/nugget'
import { ISuite } from '@lib/frameworks/suite'
import { ITest } from '@lib/frameworks/test'

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

function getProject (event: Electron.IpcMainEvent): IProject {
    return (BrowserWindow.fromWebContents(event.sender) as BrowserWindow).getProject()!
}

function getRepository (event: Electron.IpcMainEvent, repositoryId: string): Promise<IRepository> {
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

function entities (event: Electron.IpcMainEvent, context: FrameworkContext, identifiers: Array<string> = []): Promise<ProjectEntities> {
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
                    let nugget: any
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
        session!.defaultSession!.webRequest.onHeadersReceived((details, callback) => {
            callback({
                responseHeaders: {
                    ...details.responseHeaders,
                    'Content-Security-Policy': [compact([
                        'default-src \'self\'',
                        process.env.NODE_ENV === 'development' ? 'style-src \'self\' \'unsafe-inline\'' : ''
                    ]).join('; ')]
                }
            })
        })

        track.screenview('Application started')
        Window.init(state.getCurrentProject())
        applicationMenu.build()

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
    .on('refresh-menu', (event: Electron.IpcMainEvent) => {
        applicationMenu.build().then((template: Array<Electron.MenuItemConstructorOptions>) => {
            event.sender.send('menu-updated', template)
        })
    })
    .on('set-menu-options', (event: Electron.IpcMainEvent, options: any) => {
        applicationMenu.setOptions(options).then((template: Array<Electron.MenuItemConstructorOptions>) => {
            event.sender.send('menu-updated', template)
        })
    })
    .on('project-switch', (event: Electron.IpcMainEvent, identifier: ProjectIdentifier) => {
        const window = (BrowserWindow.fromWebContents(event.sender) as BrowserWindow)
        const project: IProject | null = window.getProject()
        window.setProject(identifier)
        event.sender.send('project-switched', window.getProjectOptions())
        state.set('currentProject', window.getProject()!.getId())
        if (project) {
            project.stop()
        }
    })
    .on('project-get-repositories', (event: Electron.IpcMainEvent, identifier: ProjectIdentifier) => {
        const window = (BrowserWindow.fromWebContents(event.sender) as BrowserWindow)
        const project: IProject | null = window.getProject()
        if (project) {
            event.sender.send(
                `${project.getId()}:repositories`,
                JSON.stringify(project.repositories.map((repository: IRepository) => repository.render()))
            )
        }
    })
    .on('repository-add', (event: Electron.IpcMainEvent, paths: Array<string>) => {
        const project: IProject = getProject(event)
        Promise.all(paths.map(path => {
            return project.addRepository({ path })
        })).then(repositories => {
            project.save()
            event.sender.send('repository-added', JSON.stringify(project.repositories.map(repository => repository.render())))
        })
    })
    .on('repository-remove', (event: Electron.IpcMainEvent, repositoryId: string) => {
        const project: IProject = getProject(event)
        project.removeRepository(repositoryId)
    })
    .on('repository-scan', async (event: Electron.IpcMainEvent, repositoryId: string) => {
        const repository: IRepository = await getRepository(event, repositoryId)
        const pending: Array<FrameworkOptions> = await repository.scan()
        event.sender.send(`${repositoryId}.repository-scanned`, JSON.stringify(pending))
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
    .on('repository-get-frameworks', async (event: Electron.IpcMainEvent, repositoryId: string) => {
        const repository: IRepository = await getRepository(event, repositoryId)
        event.sender.send(`${repository.getId()}:frameworks`, JSON.stringify(repository.frameworks.map(framework => framework.render())))
    })
    .on('framework-add', async (event: Electron.IpcMainEvent, repositoryId: string, options: FrameworkOptions) => {
        const repository: IRepository = await getRepository(event, repositoryId)
        repository.addFramework(options).then(framework => {
            framework.refresh()
        })
        event.sender.send(`${repositoryId}:frameworks`, JSON.stringify(repository.frameworks.map(framework => framework.render())))
    })
    .on('framework-remove', async (event: Electron.IpcMainEvent, context: FrameworkContext) => {
        entities(event, context).then(({ repository, framework }) => {
            repository.removeFramework(framework.getId())
            event.sender.send(`${repository.getId()}:frameworks`, JSON.stringify(repository.frameworks.map(framework => framework.render())))
        })
    })
    .on('framework-update', (event: Electron.IpcMainEvent, context: FrameworkContext) => {
        // const index = _findIndex(this.repository.frameworks, existing => existing.id === framework.id)
        // this.repository.frameworks[index].updateOptions({
        //     ...framework,
        //     ...{ repositoryPath: this.repository.getPath() }
        // })
        // return true
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
    .on('framework-get-suites', (event: Electron.IpcMainEvent, context: FrameworkContext) => {
        entities(event, context).then(({ framework }) => {
            event.sender.send(
                `${framework.getId()}:refreshed`,
                JSON.stringify(framework.getSuites().map((suite: ISuite) => suite.render()))
            )
        })
    })
    .on('framework-toggle-child', async (event: Electron.IpcMainEvent, context: FrameworkContext, identifiers: Array<string>, toggle: boolean) => {
        entities(event, context, identifiers).then(({ nugget }) => {
            if (toggle) {
                // If we're expanding it, send the tests to the renderer.
                event.sender.send(
                    `${nugget!.getId()}:framework-tests`,
                    JSON.stringify(nugget!.tests.map((test: ITest) => test.render(false)))
                )
                return
            }
            // If collapsing, just wither the nugget, no response is needed.
            nugget!.toggleExpanded(false, true)
        })
    })
    .on('reset-settings', (event: Electron.IpcMainEvent) => {
        state.reset()
        const window = (BrowserWindow.fromWebContents(event.sender) as BrowserWindow)
        window.clear()
        window.reload()
    })
    .on('check-if-file-exists', (event: Electron.IpcMainEvent, path: string) => {
        event.sender.send(`${path}:exists`, Fs.existsSync(path))
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
