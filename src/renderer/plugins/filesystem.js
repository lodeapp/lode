export default class Filesystem {
    constructor () {
        this.restricted = ['.cmd', '.exe', '.bat', '.sh']
    }

    install (Vue, options) {
        Vue.prototype.$fileystem = this
    }

    isExtensionSafe (extension) {
        if (__WIN32__) {
            return this.restricted.indexOf(extension.toLowerCase()) === -1
        }
        return true
    }
}
