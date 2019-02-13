import * as Path from 'path'

export const unpacked = (string) => {
    const s = Path.sep
    return string.replace(/[\\\/]app.asar[\\\/]/, `${s}app.asar.unpacked${s}`)
}
