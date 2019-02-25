import { remote, ipcRenderer } from 'electron'
import { EventEmitter } from 'events'
import { get, isEmpty } from 'lodash'
import { Project } from '@main/lib/frameworks/project'

class Controller extends EventEmitter {
    constructor () {
        super()
        ipcRenderer
            .on('project-switched', (event, projectOptions) => {
                this.loadProject(projectOptions)
            })

        // Grab initial state from window object.
        this.loadProject(remote.getCurrentWindow().getProjectOptions())
    }

    loadProject (projectOptions) {
        this.options = JSON.parse(projectOptions)
        this.project = isEmpty(this.options) ? null : new Project(this.options)
    }

    switchProject (projectId) {
        ipcRenderer.send('switch-project', projectId)
    }

    getId () {
        return get(this.options, 'id', null)
    }
}

export const project = new Controller()
