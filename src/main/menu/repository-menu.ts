import { Menu } from '@main/menu'
import { File } from '@main/file'
import { clipboard } from 'electron'
import { IRepository } from '@lib/frameworks/repository'

export class RepositoryMenu extends Menu {

    constructor (repository: IRepository, webContents: Electron.WebContents) {
        super(webContents)

        if (repository.exists()) {
            this
                .add({
                    label: repository.getDisplayName(),
                    enabled: false
                })
                .add({
                    label: __DARWIN__ ? 'Refresh' : 'Refresh',
                    click: () => {
                        repository.refresh()
                    }
                })
                .add({
                    label: __DARWIN__ ? 'Run' : 'Run',
                    click: () => {
                        repository.start()
                    }
                })
                .add({
                    label: __DARWIN__ ? 'Stop' : 'Stop',
                    click: () => {
                        repository.stop()
                    }
                })
                .separator()
                .add({
                    label: __DARWIN__ ? 'Manage Frameworks…' : 'Manage frameworks…',
                    click: () => {
                        this.emit('repository-manage', { repository: repository.render() })
                    }
                })
                .add({
                    label: __DARWIN__ ? 'Scan for Frameworks…' : 'Scan for frameworks…',
                    click: () => {
                        this.emit('repository-scan', repository.render())
                    }
                })
                .separator()
                .add({
                    id: 'copy',
                    label: __DARWIN__
                        ? 'Copy Repository Path'
                        : 'Copy repository path',
                    click: () => {
                        clipboard.writeText(repository.getPath())
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
                        File.reveal(repository.getPath())
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
                        repository.locate(this.window.getChild())
                    }
                })
        }

        this
            .separator()
            .add({
                label: 'Remove',
                click: () => {
                    this.emit('repository-remove', repository.render())
                }
            })
    }
}
