import { Menu } from '@main/menu'
import { File } from '@main/file'
import { clipboard } from 'electron'
import { IRepository } from '@lib/frameworks/repository'

export class RepositoryMenu extends Menu {
    protected repository: IRepository
    constructor (repository: IRepository, webContents: Electron.WebContents) {
        super(webContents)
        this.repository = repository
    }

    async build (): Promise<this> {
        if (await this.repository.exists()) {
            this
                .add({
                    label: this.repository.getDisplayName(),
                    enabled: false
                })
                .add({
                    label: __DARWIN__ ? 'Refresh' : 'Refresh',
                    click: () => {
                        this.repository.refresh()
                    }
                })
                .add({
                    label: __DARWIN__ ? 'Run' : 'Run',
                    click: () => {
                        this.repository.start()
                    }
                })
                .add({
                    label: __DARWIN__ ? 'Stop' : 'Stop',
                    click: () => {
                        this.repository.stop()
                    }
                })
                .separator()
                .add({
                    label: __DARWIN__ ? 'Manage Frameworks…' : 'Manage frameworks…',
                    click: () => {
                        this.emit('repository-manage', { repository: this.repository.render() })
                    }
                })
                .add({
                    label: __DARWIN__ ? 'Scan for Frameworks…' : 'Scan for frameworks…',
                    click: () => {
                        this.emit('repository-scan', this.repository.render())
                    }
                })
                .separator()
                .add({
                    id: 'copy',
                    label: __DARWIN__
                        ? 'Copy Repository Path'
                        : 'Copy repository path',
                    click: () => {
                        clipboard.writeText(this.repository.getPath())
                    }
                })
                .add({
                    id: 'reveal',
                    label: __DARWIN__
                        ? 'Reveal in Finder'
                        : __WIN32__
                            ? 'Show in Explorer'
                            : 'Show in your File Manager',
                    click: () => {
                        File.reveal(this.repository.getPath())
                    }
                })
        } else {
            this
                .add({
                    id: 'locate',
                    label: 'Repository missing',
                    enabled: false
                })
                .add({
                    id: 'locate',
                    label: __DARWIN__ ? 'Locate Repository' : 'Locate repository',
                    click: () => {
                        this.repository.locate(this.window.getChild())
                    }
                })
        }

        this
            .separator()
            .add({
                label: 'Remove',
                click: () => {
                    this.emit('repository-remove', this.repository.render())
                }
            })

        await super.build()

        return this
    }
}
