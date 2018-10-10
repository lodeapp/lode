import { Status } from '@lib/frameworks/status'
import { IRepository, Repository } from '@lib/frameworks/repository'

export interface IProject {
    repositories: Array<IRepository>
    status: Status
    selected: boolean
}

export class Project implements IProject {
    public repositories: Array<IRepository> = []
    public status: Status = 'idle'
    public selected: boolean = false

    addRepository (path: string): IRepository {
        const repository = new Repository(path)
        this.repositories.push(repository)
        return repository
    }
}
