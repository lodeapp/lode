/**
 * Supported package managers and their associated lock files.
 */
export type PackageManager = 'npm' | 'yarn' | 'pnpm' | 'bun'

const lockFileMap: ReadonlyArray<{ file: string, manager: PackageManager }> = [
    { file: 'yarn.lock', manager: 'yarn' },
    { file: 'pnpm-lock.yaml', manager: 'pnpm' },
    { file: 'bun.lockb', manager: 'bun' },
    { file: 'bun.lock', manager: 'bun' },
    { file: 'package-lock.json', manager: 'npm' },
]

/**
 * Detect the package manager used by a project based on lock files
 * present in the repository root.
 *
 * @param files The root-level files from the repository.
 * @returns The detected package manager, defaulting to 'npm'.
 */
export function detectPackageManager(files: Array<string>): PackageManager {
    for (const { file, manager } of lockFileMap) {
        if (files.includes(file)) {
            return manager
        }
    }
    return 'npm'
}

/**
 * Build a command to run a package.json script using the given
 * package manager.
 *
 * @param manager The package manager to use.
 * @param script The script name from package.json.
 */
export function buildScriptCommand(manager: PackageManager, script: string): string {
    switch (manager) {
        case 'npm':
            return `npm run ${script}`
        case 'yarn':
            return `yarn ${script}`
        case 'pnpm':
            return `pnpm run ${script}`
        case 'bun':
            return `bun run ${script}`
    }
}

/**
 * Build a command to run a locally-installed executable directly
 * (not via a package.json script). Avoids npx for npm projects
 * because npx prompts to install missing packages, which hangs
 * in non-TTY environments.
 *
 * @param manager The package manager to use.
 * @param executable The executable name (e.g. 'jest').
 */
export function buildExecCommand(manager: PackageManager, executable: string): string {
    switch (manager) {
        case 'npm':
            return `./node_modules/.bin/${executable}`
        case 'yarn':
            return `yarn ${executable}`
        case 'pnpm':
            return `pnpm exec ${executable}`
        case 'bun':
            return `bunx ${executable}`
    }
}
