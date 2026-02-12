import { SNAPSHOT_EXTENSION } from '@lib/snapshot/types'

export interface GuiCommand {
    command: 'gui'
}

export interface RunCommand {
    command: 'run'
    project: string
    repos: string[]
    frameworks: string[]
    output: string | null
    compact: boolean
    compressed: boolean
}

export interface CreateCommand {
    command: 'create'
    project: string | null
    repos: string[]
}

export interface OpenCommand {
    command: 'open'
    file: string
}

export interface HelpCommand {
    command: 'help'
}

export interface ListCommand {
    command: 'list'
}

export interface RemoveCommand {
    command: 'remove'
    project: string
}

export type CliCommand = GuiCommand | RunCommand | CreateCommand | OpenCommand | HelpCommand | ListCommand | RemoveCommand

const UUID_RE = /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i

/**
 * Whether a string looks like a v4 UUID.
 */
export function isUuid(value: string): boolean {
    return UUID_RE.test(value)
}

/**
 * Consume the next argv token as the value for a flag.
 * Throws if the next token is missing or looks like another flag.
 */
function consumeValue(raw: string[], index: number, flag: string): string {
    const value = raw[index]
    if (!value || value.startsWith('--')) {
        throw new Error(`${flag} requires a value`)
    }
    return value
}

/**
 * Parse flags for `run` and `create` subcommands.
 */
function parseFlags(raw: string[]): {
    repos: string[]
    frameworks: string[]
    output: string | null
    compact: boolean
    compressed: boolean
} {
    const result = {
        repos: [] as string[],
        frameworks: [] as string[],
        output: null as string | null,
        compact: false,
        compressed: true,
    }

    for (let i = 0; i < raw.length; i++) {
        const arg = raw[i]
        switch (arg) {
            case '--repository':
                result.repos.push(consumeValue(raw, ++i, '--repository'))
                break
            case '--framework':
                result.frameworks.push(consumeValue(raw, ++i, '--framework'))
                break
            case '--output':
                result.output = consumeValue(raw, ++i, '--output')
                break
            case '--compact':
                result.compact = true
                break
            case '--output-expanded':
                result.compressed = false
                break
            default:
                throw new Error(`Unknown flag: ${arg}`)
        }
    }

    return result
}

/**
 * Print CLI usage information.
 */
export function printHelp(): void {
    process.stdout.write(`Lode — A universal GUI for unit testing

Usage:
  lode                                      Open the application
  lode list                                 List all projects with repositories and frameworks
  lode create [name] --repository <path>    Create a new project
  lode remove <project>                     Remove a project
  lode run <project> [options]              Run tests in headless mode
  lode open <file.lode>                     Open a results file
  lode help                                 Show this help message

Create options:
  [name]                                    Project name (default: first repo's directory name)
  --repository <path>                       Repository path (required, repeatable)

Run options:
  <project>                                 Project name or UUID to run (required)
  --repository <name-or-id>                 Target specific repository (repeatable)
  --framework <[repository:]name-or-id>     Target specific framework (repeatable)
  --compact                                 Compact output (single character per test)
  --output <path>                           Output file path (default: ./<name>-<timestamp>.lode)
  --output-expanded                         Write uncompressed JSON output file
`)
}

/**
 * Parse process.argv into a structured CLI command.
 */
export function parseCliArgs(argv: string[] = process.argv): CliCommand {
    // Skip electron binary and main script path
    const raw = argv.slice(2)

    if (raw.length === 0) {
        return { command: 'gui' }
    }

    const subcommand = raw[0]

    switch (subcommand) {
        case 'help': {
            return { command: 'help' }
        }

        case 'list': {
            return { command: 'list' }
        }

        case 'remove': {
            const project = raw[1]
            if (!project || project.startsWith('--')) {
                throw new Error('remove requires a project name or UUID')
            }
            return { command: 'remove', project }
        }

        case 'create': {
            // Optional positional: project name
            const rest = raw.slice(1)
            let project: string | null = null
            if (rest.length > 0 && !rest[0].startsWith('--')) {
                project = rest.shift()!
            }
            const createFlags = parseFlags(rest)
            if (createFlags.repos.length === 0) {
                throw new Error('create requires at least one --repository')
            }
            return {
                command: 'create',
                project,
                repos: createFlags.repos,
            }
        }

        case 'run': {
            // Required positional: project name or UUID
            const rest = raw.slice(1)
            if (rest.length === 0 || rest[0].startsWith('--')) {
                throw new Error('run requires a project name or UUID as its first argument')
            }
            const project = rest.shift()!
            const runFlags = parseFlags(rest)
            return {
                command: 'run',
                project,
                repos: runFlags.repos,
                frameworks: runFlags.frameworks,
                output: runFlags.output,
                compact: runFlags.compact,
                compressed: runFlags.compressed,
            }
        }

        case 'open': {
            const filePath = raw[1]
            if (!filePath || filePath.startsWith('--')) {
                throw new Error('open requires a file path')
            }
            return {
                command: 'open',
                file: filePath,
            }
        }

        default: {
            // Convenience shorthand: `lode /path/to/file.lode`
            if (subcommand.endsWith(SNAPSHOT_EXTENSION) && !subcommand.startsWith('--')) {
                return {
                    command: 'open',
                    file: subcommand,
                }
            }

            // Ignore Electron/Node internal flags (e.g. --trace-warnings)
            if (subcommand.startsWith('--')) {
                return { command: 'gui' }
            }

            throw new Error(`Unknown command: ${subcommand}. Run "lode help" for usage.`)
        }
    }
}
