import ElectronStore from 'electron-store'
import { ipcRenderer } from 'electron'
import { ProjectOptions } from '@lib/frameworks/project'

export class Project {

    protected store: any

    constructor (id: string) {
        log.info('Initializing project store: ' + id)
        this.store = new ElectronStore({
            encryptionKey: process.env.NODE_ENV === 'production' ? 'v1' : undefined,
            name: 'project',
            defaults: {
                busy: false,
                options: {
                    id
                }
            },
            fileExtension: 'db',
            cwd: `Projects/${id}`
        })
    }

    public getPath (): string {
        return this.store.path.replace(/\/project\.db$/i, '')
    }

    public get (key?: string, fallback?: any): any {
        if (!key) {
            return this.store.store
        }

        return this.store.get(key, fallback)
    }

    public set (key: string, value?: any): void {
        this.store.set(key, value)
    }

    public save (options: ProjectOptions): void {
        options = { ...this.store.get('options'), ...options }
        this.store.set('options', options)
        if (ipcRenderer) {
            ipcRenderer.emit('project-saved', JSON.stringify(options))
        }
    }

    public toJSON (): ProjectOptions {
        return this.store.get('options')
    }

    public isBusy (): boolean {
        return this.store.get('busy', false)
    }
}

