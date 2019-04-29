import * as Path from 'path'

export function unpacked (string: string): string {
    const s = Path.sep
    return string.replace(/[\\\/]app.asar[\\\/]/, `${s}app.asar.unpacked${s}`)
}
