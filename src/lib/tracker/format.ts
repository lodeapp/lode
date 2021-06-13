export function appName () {
    if (__DARWIN__) {
        return 'Lode Mac'
    } else if (__WIN32__) {
        return 'Lode Windows'
    } else if (__LINUX__) {
        return 'Lode Linux'
    }
    return 'Unknown'
}
