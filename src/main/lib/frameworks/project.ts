import { EventEmitter } from 'events'
import { FrameworkStatus, parseFrameworkStatus } from '@lib/frameworks/status'
import { IRepository, Repository } from '@lib/frameworks/repository'

export interface IProject extends EventEmitter {
    repositories: Array<IRepository>
    status: FrameworkStatus
    selected: boolean
}

export class Project extends EventEmitter implements IProject {
    public repositories: Array<IRepository> = []
    public status: FrameworkStatus = 'idle'
    public selected: boolean = false

    /**
     * A function to run when a child repository changes its status.
     */
    protected statusListener () {
        this.updateStatus(parseFrameworkStatus(this.repositories.map(repository => repository.status)))
    }

    /**
     * Update this project's status.
     *
     * @param to The status we're updating to.
     */
    protected updateStatus (to: FrameworkStatus): void {
        const from = this.status
        this.status = to
        this.emit('status', to, from)
    }

    /**
     * Add a child repository to this project.
     *
     * @param path The path of the repository we're adding.
     */
    public addRepository (path: string): IRepository {
        const repository = new Repository(path)
        repository.on('status', this.statusListener.bind(this))
        this.repositories.push(repository)
        return repository
    }
}
