import * as Path from 'path'
import { pathExistsSync } from 'fs-extra'

export default class Filesystem {
    constructor () {
        this.restricted = ['.cmd', '.exe', '.bat', '.sh']
    }

    install (Vue, options) {
        Vue.prototype.$fileystem = this
    }

    exists (path) {
        return pathExistsSync(path)
    }

    isSafe (path) {
        return this.isExtensionSafe(Path.extname(path))
    }

    isExtensionSafe (extension) {
        if (__WIN32__) {
            return this.restricted.indexOf(extension.toLowerCase()) === -1
        }
        return true
    }
}
