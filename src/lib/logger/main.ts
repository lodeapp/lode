import { ipcRenderer } from 'electron'
import { Console } from './console'

export class Main extends Console {

    protected commit (method: string, ...data: Array<any>): void {

        if (!__DEV__) {
            return
        }

        ipcRenderer.send('console', ...data)
    }
}
