import ElectronStore from 'electron-store'
import { ProjectOptions } from '@lib/frameworks/project'

export class Project {
    protected store: any

    constructor (id: string) {
        log.info('Initializing project store: ' + id)
        this.store = new ElectronStore({
            encryptionKey: 'v1',
            name: 'project',
            defaults: {
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
        this.store.set('options', {
            ...this.store.get('options'),
            ...options
        })
    }

    public toJSON (): ProjectOptions {
        return this.store.get('options')
    }
}
