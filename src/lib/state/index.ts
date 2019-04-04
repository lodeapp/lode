import * as Path from 'path'
import * as Fs from 'fs-extra'
import latinize from 'latinize'
import { find, findIndex, sortBy, uniqBy } from 'lodash'
import { EventEmitter } from 'events'
import { app } from 'electron'
import ElectronStore from 'electron-store'
import { Project } from '@lib/state/project'
import { ProjectIdentifier } from '@lib/frameworks/project'

class State extends EventEmitter {
    protected store: any
    protected defaultSettings: object = {
        concurrency: 3,
        confirm: {
            switchProject: true
        },
        currentProject: null,
        paneSizes: [24, 38, 38],
        projects: []
    }

    constructor () {
        super()
        this.store = new ElectronStore({
            encryptionKey: 'v1',
            defaults: this.defaultSettings
        })
    }

    public get (key?: string, fallback?: any): any {
        return this.store.get(key, fallback)
    }

    public set (key: string, value?: any): void {
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

    public reset (): void {
        this.emit('clear', this.get())
        this.store.clear()
        const userData = app.getPath('userData')
        if (userData) {
            Fs.removeSync(Path.join(userData, 'Projects'))
        }
    }

    public hasProjects (): boolean {
        return this.store.get('projects', []).length > 0
    }

    public getCurrentProject (): string | null {
        const currentProject = this.store.get('currentProject', null)
        // If current project is not set or it doesn't exist in the full list of projects, return null.
        if (!currentProject || !find(this.store.get('projects'), { id: currentProject })) {
            return null
        }
        return currentProject
    }

    public getAvailableProjects (): Array<ProjectIdentifier> {
        return sortBy(this.store.get('projects'), [(project: ProjectIdentifier) => {
            return latinize(project.name).toLowerCase()
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
        return projectId
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

    public project (id: string): Project {
        const project = new Project(id)
        // If project already has a name, add it to the available projects list.
        if (project.get('options.name')) {
            this.store.set('projects', uniqBy(this.store.get('projects', []).concat([{
                id,
                name: project.get('options.name')
            }]), 'id'))
        }
        return project
    }
}

export const state = new State()
