import { stringify } from 'flatted'

export function send(webContents: Electron.WebContents, name: string, args: Array<any>) {
    webContents.send(name, stringify({
        args
    }))
}
