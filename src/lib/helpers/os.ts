import * as OS from 'node:os'

function getSystemVersionSafe() {
    if (__DARWIN__) {
        // getSystemVersion only exists when running under Electron, and not when
        // running unit tests which frequently end up calling this. There are no
        // other known reasons why getSystemVersion() would return anything other
        // than a string
        return 'getSystemVersion' in process
            ? process.getSystemVersion()
            : undefined
    }

    return OS.release()
}

/** Get the OS we're currently running on. */
export function getOS() {
    const version = getSystemVersionSafe()
    if (__DARWIN__) {
        return `Mac OS ${version}`
    }
    else if (__WIN32__) {
        return `Windows ${version}`
    }
    else {
        return `${OS.type()} ${version}`
    }
}
