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

    addRepository (path: string): IRepository {
        const repository = new Repository(path)
        repository.on('status', this.statusListener.bind(this))
        this.repositories.push(repository)
        return repository
    }

    updateStatus (to: FrameworkStatus): void {
        const from = this.status
        this.status = to
        this.emit('status', to, from)
    }

    statusListener () {
        console.log('updating project status', parseFrameworkStatus(this.repositories.map(repository => repository.status)))
        this.updateStatus(parseFrameworkStatus(this.repositories.map(repository => repository.status)))
    }
}
