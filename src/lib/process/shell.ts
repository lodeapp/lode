import * as defaultShell from 'default-shell'
import * as shellEnv from 'shell-env'

/**
 * The names of any env vars that we shouldn't copy from the shell environment.
 */
const BlacklistedNames = new Set(['LOCAL_GIT_DIRECTORY'])

/**
 * Merge environment variables from shell into the current process, if needed.
 */
export function mergeEnvFromShell(force = false): void {
    if (!force && !needsEnv(process)) {
        return
    }

    try {
        const env = shellEnv.sync(getUserShell())
        for (const key in env) {
            if (BlacklistedNames.has(key)) {
                continue
            }

            process.env[key] = env[key]
        }
    }
    catch (error) {
        // shell-env throws when the user's shell can't be spawned (e.g.
        // misconfigured shell, sandbox restrictions). Log and continue —
        // the login-shell wrapping in DefaultProcess will still attempt to
        // resolve binaries at spawn time.
        log.warn('Failed to merge shell environment', error as Error)
    }
}

/**
 * Whether the current process needs to have shell environment
 * variables merged in.
 *
 * @param process The process to inspect.
 */
function needsEnv(process: NodeJS.Process): boolean {
    return __DARWIN__ && !process.env.TERM
}

/**
 * Get the user-defined shell, if any.
 */
export function getUserShell() {
    if (process.env.SHELL) {
        return process.env.SHELL
    }

    return defaultShell
}
