import { State } from './index'
import { Project } from '@lib/state/project'

export abstract class Migration {

    protected state: State
    protected projects: Array<Project> = []

    constructor (state: State, projects: Array<Project>) {
        this.state = state
        this.projects = projects
    }

    public abstract up (): void
    public abstract down (): void
}
