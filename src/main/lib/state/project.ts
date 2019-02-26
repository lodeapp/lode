import ElectronStore from 'electron-store'
import { ipcRenderer } from 'electron'
import { ProjectOptions } from '@main/lib/frameworks/project'

export class Project {

    protected store: any

    constructor (id: string) {
        this.store = new ElectronStore({
            name: id,
            defaults: {
                busy: false,
                options: {
                    id
                }
            },
            fileExtension: 'lode',
            cwd: 'Projects'
        })
    }

    public get (key?: string, fallback?: any): any {
        return this.store.get(key, fallback)
    }

    public set (key: string, value?: any): void {
        this.store.set(key, value)
    }

    public save (options: ProjectOptions): void {
        options = {...this.store.get('options'), ...options}
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

