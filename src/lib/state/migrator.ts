import { State } from './index'
import { Project } from '@lib/state/project'

const context = (require as any).context('@lib/state/migrations', true, /\.ts/)
const Migrations: any = {}
context.keys().forEach((key: string) => {
    Migrations[key.replace(/^\.\/([aA0-zZ9\-]+)\.ts/, '$1')] = context(key).default
})

export class Migrator {

    protected state: State
    protected version: number
    protected projects: Array<Project> = []

    constructor (state: State, version: number) {
        log.info('Preparing migration')
        this.state = state
        this.version = version
        const store: any = state.get()
        store.projects.forEach((p: any) => {
            this.projects.push(state.project(p.id))
        })
    }

    protected migrate (direction: 'up' | 'down'): void {
        switch (this.version) {
            // ...
        }
    }

    public up (): void {
        return this.migrate('up')
    }

    public down (): void {
        return this.migrate('down')
    }
}
