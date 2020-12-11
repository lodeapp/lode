import * as Path from 'path'
import * as Fs from 'fs-extra'
import latinize from 'latinize'
import { v4 as uuid } from 'uuid'
import { find, findIndex, sortBy, uniqBy } from 'lodash'
import { EventEmitter } from 'events'
import { app } from 'electron'
import ElectronStore from 'electron-store'
import { Project } from '@lib/state/project'
import { ProjectIdentifier } from '@lib/frameworks/project'

export class State extends EventEmitter {
    protected store: any
    protected currentVersion: number = 1
    protected defaultSettings: object = {
        userid: uuid(),
        concurrency: 3,
        confirm: {
            switchProject: true
        },
        currentProject: null,
        paneSizes: [16, 44, 40],
        projects: []
    }

    constructor () {
        super()
        this.store = new ElectronStore({
            encryptionKey: 'v1',
            defaults: {
                ...this.defaultSettings,
                ...{
                    version: this.currentVersion
                }
            }
        })

        // Logger may be undefined (i.e. when initializing mocks during testing)
        if (typeof log !== 'undefined') {
            log.info('Initializing main store with version: ' + this.getVersion())
        }
    }

    protected getVersion (): number {
        return this.get('version', 1)
    }

    public get (key?: string, fallback?: any): any {
        if (!key) {
            return this.store.store
        }

        return this.store.get(key, fallback)
    }

    public set (key: string | object, value?: any): void {
        this.emit('set:' + key, value)
        return this.store.set(key, value)
    }

    public save (state: object, overwrite = false): void {
        if (!overwrite) {
            state = { ...this.get(), ...state}
        }
        this.store.set(state)
        this.emit('save', state)
    }

    public async reset (): Promise<void> {
        log.info('Resetting settings.')
        this.emit('clear', this.get())
        this.store.clear()
        const userData = app.getPath('userData')
        if (userData) {
            await Fs.remove(Path.join(userData, 'Projects'))
        }
    }

    public hasProjects (): boolean {
        return this.store.get('projects', []).length > 0
    }

    public getCurrentProject (): ProjectIdentifier | null {
        const currentProject = this.store.get('currentProject', null)
        // If current project is not set or it doesn't exist in the full list of projects, return null.
        if (!currentProject || !find(this.store.get('projects'), { id: currentProject })) {
            return null
        }
        return ({ id: currentProject, name: '' } as ProjectIdentifier)
    }

    public getAvailableProjects (): Array<ProjectIdentifier> {
        return sortBy(this.store.get('projects'), [(project: ProjectIdentifier) => {
            return latinize(project.name!).toLowerCase()
        }])
    }

    public removeProject (projectId: string): string | null {
        const projects = this.store.get('projects', [])
        const projectIndex = findIndex(projects, { id: projectId })
        if (projectIndex > -1) {
            projects.splice(projectIndex, 1)
            this.store.set('projects', projects)
            // After removing project, switch to left adjacent project, or reset
            const index = Math.max(0, (projectIndex - 1))
            const switchTo = typeof projects[index] !== 'undefined' ? projects[index].id : null
            this.store.set('currentProject', switchTo)
            return switchTo
        }
        return null
    }

    public updateProject (options: ProjectIdentifier): void {
        const projects = this.store.get('projects', [])
        const projectIndex = findIndex(projects, { id: options.id })
        if (projectIndex > -1) {
            projects[projectIndex] = {
                ...projects[projectIndex],
                ...options
            }
            this.store.set('projects', projects)
        }
    }

    public project (identifier: ProjectIdentifier): Project {
        const project = new Project(identifier.id!)
        // If project is new, set its name.
        if (!project.get('options.name')) {
            project.set('options.name', identifier.name)
        }

        this.store.set('projects', uniqBy(this.store.get('projects', []).concat([{
            id: identifier.id,
            name: project.get('options.name')
        }]), 'id'))

        return project
    }
}

export const state = new State()
