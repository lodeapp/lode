import Fs from 'fs'
import * as Url from 'url'
import * as Path from 'path'
import { pathExistsSync } from 'fs-extra'
import { shell } from 'electron'

export class File {
    protected static restricted = ['.cmd', '.exe', '.bat', '.sh']

    /**
     * Whether a given extension is considered safe to open.
     *
     * @param extension The extension to check
     */
    public static isExtensionSafe (extension: object): boolean {
        if (__WIN32__) {
            return this.restricted.indexOf(extension.toLowerCase()) === -1
        }
        return true
    }

    /**
     * Whether a given file exists
     *
     * @param path The path of the file to check
     */
    public static exists (path: string): boolean {
        return pathExistsSync(path)
    }

    /**
     * Whether a given file is safe to open.
     *
     * @param path The path of the file to check
     */
    public static isSafe (path: string): boolean {
        return this.isExtensionSafe(Path.extname(path))
    }

    /**
     * Open a given path.
     *
     * @param path The path to open
     */
    public static async open (path: string): Promise<void> {
        if (this.isSafe(path)) {
            return shell.openExternal(`file://${path}`)
        }
    }

    /**
     * Reveal a given path in Finder/File explorer.
     *
     * @param path The path to be revealed
     */
    public static reveal (path: string): void {
        Fs.stat(path, (err, stats) => {
            if (err) {
                log.error(`Unable to find file at '${path}'`, err)
                return
            }

            if (!__DARWIN__ && stats.isDirectory()) {
                this.openDirectorySafe(path)
            } else {
                shell.showItemInFolder(path)
            }
        })
    }

    /**
     * Wraps the inbuilt shell.openItem path to address a focus issue that affects macOS.
     *
     * When opening a folder in Finder, the window will appear behind the application
     * window, which may confuse users. As a workaround, we will fallback to using
     * shell.openExternal for macOS until it can be fixed upstream.
     *
     * @param path The directory to open
     */
    public static openDirectorySafe (path: string): void {
        if (__DARWIN__) {
            const directoryURL = Url.format({
                pathname: path,
                protocol: 'file:',
                slashes: true,
            })

            shell
                .openExternal(directoryURL)
                .catch(err => log.error(`Failed to open directory (${path})`, err))
        } else {
            shell.openPath(path)
        }
    }
}
