import latinize from 'latinize'
import ElectronStore from 'electron-store'
import { merge, cloneDeep, sortBy } from 'lodash'
import { ProjectOptions } from '@lib/frameworks/project'

export class Settings {
    private store: ElectronStore
    private defaultSettings: object = {
        maxProcesses: 3,
        currentProject: null,
        projects: []
    }

    constructor () {
        this.store = new ElectronStore()
        this.save(merge(
            cloneDeep(this.defaultSettings),
            cloneDeep(this.store.store)
        ))
    }

    public get (key?: string, fallback?: any): any {
        if (key) {
            switch (key) {
                case 'projects':
                    return sortBy(this.store.get(key), [(project: ProjectOptions) => {
                        return latinize(project.name).toLowerCase()
                    }])

                default:
                    return this.store.get(key, fallback)
            }
        }
        return this.store.store
    }

    public save (state: object): void {
        this.store.set(state)
    }

    public clear (): void {
        this.store.clear()
    }
}
