import ElectronStore from 'electron-store'
import { ProjectOptions } from '@main/lib/frameworks/project'

export interface IProjectState {
    isBusy (): boolean
}

export class Project implements IProjectState {

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

    public get (key: string, fallback?: any): any {
        return this.store.get(key, fallback)
    }

    public set (key: string, value?: any): void {
        this.store.set(key, value)
    }

    public update (options: ProjectOptions): void {
        this.store.set('options', {...this.store.get('options'), ...options})
    }

    public toJSON (): ProjectOptions {
        return this.store.get('options')
    }

    public isBusy (): boolean {
        return this.store.get('busy', false)
    }
}

