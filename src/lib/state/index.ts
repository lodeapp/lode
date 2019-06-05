import * as Path from 'path'
import * as Fs from 'fs-extra'
import latinize from 'latinize'
import { find, findIndex, sortBy, uniqBy } from 'lodash'
import { EventEmitter } from 'events'
import { app } from 'electron'
import ElectronStore from 'electron-store'
import { Project } from '@lib/state/project'
import { Migrator } from '@lib/state/migrator'
import { ProjectIdentifier } from '@lib/frameworks/project'

export class State extends EventEmitter {
    protected store: any
    protected currentVersion: number = 1
    protected defaultSettings: object = {
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
        log.info('Initializing main store with version: ' + this.getVersion())

        if (__MIGRATE__) {
            this.runMigrations()
        }
    }

    protected getVersion (): number {
        return this.get('version', 1)
    }

    protected isMainProcess (): boolean {
        return typeof app !== 'undefined'
    }

    protected runMigrations (): void {
        if (!this.isMainProcess()) {
            return
        }

        this.migrateUpTo()
    }

    public migrateUpTo (target?: number): void {
        if (!target) {
            target = this.currentVersion
        }
        let version = this.getVersion()
        if (version < target) {
            while (version < target) {
                version++
                log.info('Migrating main store to version: ' + version)
                const migrator: Migrator = new Migrator(this, version)
                try {
                    migrator.up()
                    this.set('version', version)
                } catch (error) {
                    log.error('Migration of main store to version "' + version + '" failed. Aborting.')
                }
            }
        }
    }

    public migrateDownTo (target: number = 0): void {
        let version = this.getVersion()
        if (version > target) {
            while (version > target) {
                version--
                log.info('Migrating main store to version: ' + version)
                const migrator: Migrator = new Migrator(this, (version + 1))
                try {
                    migrator.down()
                    this.set('version', version)
                } catch (error) {
                    log.error('Migration of main store to version "' + version + '" failed. Aborting.')
                }
            }
        }
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

    public reset (): void {
        log.info('Resetting settings.')
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
