import latinize from 'latinize'
import ElectronStore from 'electron-store'
import { EventEmitter } from 'events'
import { merge, cloneDeep, sortBy } from 'lodash'
import { ProjectOptions } from '@main/lib/frameworks/project'

export class Settings extends EventEmitter {
    private store: ElectronStore
    private defaultSettings: object = {
        concurrency: 3,
        confirm: {
            switchProject: true
        },
        currentProject: null,
        projects: []
    }

    constructor () {
        super()
        this.store = new ElectronStore()
        this.save(merge(
            cloneDeep(this.defaultSettings),
            cloneDeep(this.store.store)
        ))
    }

    public get (key?: string): any {
        if (key) {
            switch (key) {

                case 'projects':
                    return sortBy(this.store.get('projects'), [(project: ProjectOptions) => {
                        return latinize(project.name).toLowerCase()
                    }])

                case 'concurrency':
                    return this.store.get('concurrency', 3)

                default:
                    return this.store.get(key)
            }
        }

        return this.store.store
    }

    public set (key: string, value?: any): void {
        this.emit('set:' + key, value)
        return this.store.set(key, value)
    }

    public save (state: object, overwrite = false): void {
        if (!overwrite) {
            state = { ...this.get(), ...state}
        }
        this.emit('save', state)
        this.store.set(state)
    }

    public clear (): void {
        this.emit('clear', this.get())
        this.store.clear()
    }

    public keys (): Array<string> {
        const keys = (obj: object): Array<string> => {
            return Object.keys(obj)
                .filter((key: string) => (obj as any)[key] instanceof Object)
                .map((key: string) => keys((obj as any)[key]).map((k: string) => `${key}.${k}`))
                .reduce((x, y) => x.concat(y), Object.keys(obj))
        }
        return keys(this.get())
    }
}
