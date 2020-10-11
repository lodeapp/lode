import { stringify } from 'flatted'

export function send(webContents: Electron.WebContents, name: string, args: Array<any>) {
    console.debug(name, args)
    webContents.send(name, stringify({
        args
    }))
}
