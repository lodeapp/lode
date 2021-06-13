import * as Path from 'path'

export function getResourceDirectory (): string {
    return __DEV__
        ? Path.join(process.cwd(), 'dist')
        : Path.join(process.resourcesPath, 'app.asar.unpacked', 'dist')
}

/**
 * Modifies a given path to return its location as an unpacked asset
 * (i.e. not part of the app's package, so publicly available. This is
 * useful for reporters, which have to be read or injected by the
 * filesystem during test framework runs.)
 *
 * @param loc The path to process.
 */
export function unpacked (loc: string): string {
    const s = Path.sep
    return loc.replace(/[\\\/]?\bapp\.asar\b[\\\/]?/, `${s}app.asar.unpacked${s}`)
}

/**
 * Rebuild a POSIX path into a platform-specific one, by replacing
 * its path separators. This is because we hardcode all our paths
 * as POSIX for readability.
 *
 * @param loc The path to process.
 */
export function loc (loc: string): string {
    return loc.split('/').join(Path.sep)
}

/**
 * Force a path (potentially Windows-specific) into a POSIX one. Not
 * necessarily bullet-proof, but could be useful for some transformations.
 *
 * @param loc The path to process.
 */
export function posix (loc: string): string {
    return loc.split(Path.sep).join('/')
}
