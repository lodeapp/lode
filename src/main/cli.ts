import { SNAPSHOT_EXTENSION } from '@lib/snapshot/types'
import { app } from 'electron'

export interface GuiCommand {
    command: 'gui'
}

export interface RunCommand {
    command: 'run'
    project: string
    repos: string[]
    frameworks: string[]
    output: string | true | null
    compact: boolean
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
    filter: string | null
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
    output: string | true | null
    compact: boolean
} {
    const result = {
        repos: [] as string[],
        frameworks: [] as string[],
        output: null as string | true | null,
        compact: false,
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
                if (i + 1 < raw.length && !raw[i + 1].startsWith('--')) {
                    result.output = raw[++i]
                }
                else {
                    result.output = true
                }
                break
            case '--compact':
                result.compact = true
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
  lode list [filter]                        List projects (filter by name prefix)
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
  --output [path]                           Write a results file (default: ./<name>-<timestamp>.lode)
                                            Use .json extension for uncompressed JSON output
`)
}

/**
 * Parse process.argv into a structured CLI command.
 */
export function parseCliArgs(argv: string[] = process.argv): CliCommand {
    // In dev mode argv = [electron, script, ...args] (skip 2).
    // In a packaged app argv = [binary, ...args] (skip 1).
    const raw = argv.slice(app.isPackaged ? 1 : 2)

    if (raw.length === 0) {
        return { command: 'gui' }
    }

    const subcommand = raw[0]

    switch (subcommand) {
        case 'help': {
            return { command: 'help' }
        }

        case 'list': {
            const filter = raw[1] && !raw[1].startsWith('--') ? raw[1] : null
            return { command: 'list', filter }
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
            if ((subcommand.endsWith(SNAPSHOT_EXTENSION) || subcommand.endsWith('.json')) && !subcommand.startsWith('--')) {
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
