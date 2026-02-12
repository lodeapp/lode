import type { IFramework } from '@lib/frameworks/framework'
import type { IProject } from '@lib/frameworks/project'
import type { IRepository } from '@lib/frameworks/repository'
import type { Status, StatusLedger } from '@lib/frameworks/status'
import type { ISuiteResult } from '@lib/frameworks/suite'
import type { ITestResult } from '@lib/frameworks/test'
import type { RunCommand } from '@main/cli'
import * as Path from 'node:path'
import { Project } from '@lib/frameworks/project'
import { mergeEnvFromShell } from '@lib/process/shell'
import { writeSnapshot } from '@lib/snapshot/writer'
import { state } from '@lib/state'
import { isUuid } from '@main/cli'
import { asApplicationWindow, HeadlessWindow } from '@main/headless-window'
import { app } from 'electron'

interface Named {
    getId: () => string
    getDisplayName: () => string
}

// ANSI escape codes for terminal coloring.
const ANSI = {
    reset: '\x1B[0m',
    green: '\x1B[32m',
    red: '\x1B[31m',
    yellow: '\x1B[33m',
    gray: '\x1B[90m',
} as const

/**
 * Find a single item by name or UUID in a list.
 * Throws with a descriptive error if not found.
 */
export function findByNameOrId<T extends Named>(
    items: T[],
    nameOrId: string,
    label: string,
): T {
    const match = items.find(item =>
        isUuid(nameOrId) ? item.getId() === nameOrId : item.getDisplayName() === nameOrId,
    )
    if (!match) {
        const available = items.map(i => i.getDisplayName()).join(', ')
        throw new Error(`${label} not found: "${nameOrId}". Available: ${available || '(none)'}`)
    }
    return match
}

/**
 * Find a project by name or ID from the state store.
 */
export function findProject(nameOrId: string): { id: string, name: string } {
    const projects = state.getAvailableProjects()
    if (isUuid(nameOrId)) {
        const match = projects.find(p => p.id === nameOrId)
        if (!match) {
            throw new Error(`No project found with ID: ${nameOrId}`)
        }
        return match as { id: string, name: string }
    }

    const matches = projects.filter(p => p.name === nameOrId)
    if (matches.length === 0) {
        const available = projects.map(p => p.name).join(', ')
        throw new Error(`No project found with name: "${nameOrId}". Available: ${available || '(none)'}`)
    }
    if (matches.length > 1) {
        throw new Error(`Ambiguous project name: "${nameOrId}" matches ${matches.length} projects. Use the project ID instead.`)
    }
    return matches[0] as { id: string, name: string }
}

/**
 * Resolve a single --framework value, which may be:
 * - A UUID (globally unique, search all repos)
 * - A prefixed name "repo:framework" (scoped to a specific repo)
 * - A plain name (search all repos, fail if ambiguous)
 */
function resolveFramework(
    repositories: IRepository[],
    value: string,
): IFramework {
    // UUID: globally unique, search all repos
    if (isUuid(value)) {
        const allFrameworks = repositories.flatMap(r => [...r.frameworks])
        return findByNameOrId(allFrameworks, value, 'Framework')
    }

    // Prefixed: "repo:framework"
    if (value.includes(':')) {
        const colonIndex = value.indexOf(':')
        const repoRef = value.slice(0, colonIndex)
        const fwRef = value.slice(colonIndex + 1)
        const repo = findByNameOrId(repositories, repoRef, 'Repository')
        return findByNameOrId([...repo.frameworks], fwRef, 'Framework')
    }

    // Plain name: search all repos, fail on ambiguity
    const allFrameworks = repositories.flatMap(r => [...r.frameworks])
    const matches = allFrameworks.filter(f => f.getDisplayName() === value)
    if (matches.length === 0) {
        const available = allFrameworks.map(f => f.getDisplayName()).join(', ')
        throw new Error(`Framework not found: "${value}". Available: ${available || '(none)'}`)
    }
    if (matches.length > 1) {
        const repoNames = repositories
            .filter(r => r.frameworks.some(f => f.getDisplayName() === value))
            .map(r => `${r.getDisplayName()}:${value}`)
            .join(', ')
        throw new Error(`Ambiguous framework name: "${value}" exists in multiple repositories. Use a prefix to disambiguate: ${repoNames}`)
    }
    return matches[0]
}

/**
 * Resolve targeted repositories and frameworks from CLI args.
 */
export function resolveTargets(
    project: IProject,
    args: { repos: string[], frameworks: string[] },
): { repositories: IRepository[], frameworks: IFramework[] } {
    const repositories = args.repos.length > 0
        ? args.repos.map(name => findByNameOrId(project.repositories, name, 'Repository'))
        : [...project.repositories]

    let frameworks: IFramework[]
    if (args.frameworks.length > 0) {
        frameworks = args.frameworks.map(value => resolveFramework(repositories, value))
    }
    else {
        frameworks = repositories.flatMap(r => [...r.frameworks])
    }

    return { repositories, frameworks }
}

/**
 * Aggregate ledgers from multiple frameworks into totals.
 */
export function aggregateLedgers(frameworks: IFramework[]): StatusLedger {
    const keys: Array<keyof StatusLedger> = [
        'passed',
        'failed',
        'error',
        'skipped',
        'incomplete',
        'warning',
        'queued',
        'running',
        'partial',
        'empty',
        'idle',
    ]
    const totals = {} as StatusLedger
    for (const key of keys) {
        totals[key] = 0
    }
    for (const fw of frameworks) {
        const ledger = fw.getLedger()
        for (const key of keys) {
            totals[key] += ledger[key] || 0
        }
    }
    return totals
}

/**
 * ANSI color code for a given test status.
 */
function colorForStatus(status: Status): string {
    switch (status) {
        case 'passed': return ANSI.green
        case 'failed': return ANSI.red
        case 'error': return ANSI.red
        case 'skipped': return ANSI.yellow
        case 'warning': return ANSI.yellow
        case 'incomplete': return ANSI.yellow
        default: return ANSI.gray
    }
}

/**
 * Format a ledger into a human-readable summary string.
 * Pass `color = true` for ANSI-colored output.
 */
export function formatSummary(ledger: StatusLedger, color = false): string {
    const labels: Array<[keyof StatusLedger, string]> = [
        ['passed', 'passed'],
        ['failed', 'failed'],
        ['error', 'errors'],
        ['skipped', 'skipped'],
        ['incomplete', 'incomplete'],
        ['warning', 'warnings'],
    ]
    return labels
        .filter(([key]) => ledger[key] > 0)
        .map(([key, label]) => {
            const text = `${ledger[key]} ${label}`
            if (!color) {
                return text
            }
            return `${colorForStatus(key as Status)}${text}${ANSI.reset}`
        })
        .join(', ')
}

/**
 * Generate default output path for a headless run.
 */
export function defaultOutputPath(projectName: string): string {
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
    const safeName = projectName.replace(/[^\w-]/g, '-').toLowerCase()
    return Path.resolve(`./${safeName}-${timestamp}.lode`)
}

/**
 * Recursively flatten nested test results into leaf tests.
 */
export function flattenTests(tests: ITestResult[]): ITestResult[] {
    const result: ITestResult[] = []
    for (const test of tests) {
        if (test.tests && test.tests.length > 0) {
            result.push(...flattenTests(test.tests))
        }
        else {
            result.push(test)
        }
    }
    return result
}

/**
 * Unicode icon for a test status (normal output mode).
 */
function iconForStatus(status: Status): string {
    switch (status) {
        case 'passed': return '\u2713'
        case 'failed': return '\u00D7'
        case 'error': return '\u00D7'
        case 'skipped': return '\u2193'
        case 'warning': return '!'
        case 'incomplete': return '\u2193'
        default: return '-'
    }
}

/**
 * Single character for a test status (compact output mode).
 */
function symbolForStatus(status: Status): string {
    switch (status) {
        case 'passed': return '.'
        case 'failed': return 'F'
        case 'error': return 'E'
        case 'skipped': return 'S'
        case 'warning': return 'W'
        case 'incomplete': return 'I'
        default: return '?'
    }
}

/**
 * Format a suite result for normal (verbose) output.
 * Prints the suite file path as a header, then each test on its own line.
 */
export function formatSuiteNormal(suiteResult: ISuiteResult): string {
    const tests = flattenTests(suiteResult.tests || [])
    if (tests.length === 0) {
        return ''
    }

    const lines: string[] = []
    const suitePath = suiteResult.relative || suiteResult.file
    lines.push(`${ANSI.gray}${suitePath}${ANSI.reset}`)

    for (const test of tests) {
        const color = colorForStatus(test.status)
        const icon = iconForStatus(test.status)
        const name = test.displayName || test.name
        lines.push(`  ${color}${icon}${ANSI.reset} ${name}`)
    }

    return `${lines.join('\n')}\n`
}

/**
 * Format a suite result for compact output.
 * Returns a colored string of single characters, one per test.
 */
export function formatSuiteCompact(suiteResult: ISuiteResult): string {
    const tests = flattenTests(suiteResult.tests || [])
    return tests
        .map((test) => {
            const symbol = symbolForStatus(test.status)
            if (test.status === 'passed') {
                return symbol
            }
            return `${colorForStatus(test.status)}${symbol}${ANSI.reset}`
        })
        .join('')
}

/**
 * Run tests headlessly and produce a snapshot file.
 * Returns the process exit code: 0 = all pass, 1 = failures, 2 = errors.
 */
export async function runHeadless(args: RunCommand): Promise<number> {
    // Ensure the user's full shell environment (PATH, etc.) is available,
    // even when launched from a context where PWD is already set.
    mergeEnvFromShell(true)

    const projectInfo = findProject(args.project)

    process.stdout.write(`Lode v${app.getVersion()} — Headless Mode\n`)
    process.stdout.write(`Project: ${projectInfo.name}\n`)

    const headlessWindow = new HeadlessWindow()
    const project = new Project(asApplicationWindow(headlessWindow), { id: projectInfo.id })

    // Wait for the project to be ready (repositories and frameworks loaded)
    await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error('Project failed to become ready within 60 seconds'))
        }, 60_000)

        project.on('ready', () => {
            clearTimeout(timeout)
            resolve()
        })
    })

    const { repositories, frameworks } = resolveTargets(project, args)

    // Print targets
    for (const repo of repositories) {
        const repoFrameworks = frameworks.filter(f =>
            repo.frameworks.some((rf: IFramework) => rf.getId() === f.getId()),
        )
        if (repoFrameworks.length === 0) {
            continue
        }
        process.stdout.write(`  Repository: ${repo.getDisplayName()}\n`)
        for (const fw of repoFrameworks) {
            process.stdout.write(`    Framework: ${fw.getDisplayName()} (${fw.getSuites().length} suites)\n`)
        }
    }
    process.stdout.write('\n')

    // Track framework-level errors (process crashes, missing binaries, etc.)
    const frameworkErrors: Map<string, Error> = new Map()

    // Track last printed suite file so we only print the header once
    // (some frameworks like PHPUnit report one test at a time)
    let lastSuiteFile: string | null = null

    // Subscribe to live suite results and framework errors before starting
    for (const fw of frameworks) {
        fw.on('suite-debriefed', (suiteResult: ISuiteResult) => {
            if (args.compact) {
                process.stdout.write(formatSuiteCompact(suiteResult))
            }
            else {
                const suitePath = suiteResult.relative || suiteResult.file
                if (suitePath !== lastSuiteFile) {
                    lastSuiteFile = suitePath
                    process.stdout.write(`${ANSI.gray}${suitePath}${ANSI.reset}\n`)
                }
                const tests = flattenTests(suiteResult.tests || [])
                for (const test of tests) {
                    const color = colorForStatus(test.status)
                    const icon = iconForStatus(test.status)
                    const name = test.displayName || test.name
                    process.stdout.write(`  ${color}${icon}${ANSI.reset} ${name}\n`)
                }
            }
        })

        fw.on('error', (error: Error) => {
            frameworkErrors.set(fw.getId(), error)
            process.stderr.write(
                `${ANSI.red}Error in ${fw.getDisplayName()}: ${error.message.trim()}${ANSI.reset}\n`,
            )
        })
    }

    // Exit cleanly on Ctrl+C
    process.on('SIGINT', () => {
        for (const fw of frameworks) {
            fw.stop()
        }
        process.stdout.write('\n')
        process.exit(130)
    })

    // Start targeted frameworks
    for (const fw of frameworks) {
        fw.start()
    }

    // Wait for completion
    await new Promise<void>((resolve) => {
        const checkInterval = setInterval(() => {
            if (!frameworks.some(f => f.isBusy())) {
                clearInterval(checkInterval)
                resolve()
            }
        }, 500)
    })

    process.stdout.write('\n')

    // Build summary: aggregate suite-level counts, then add framework errors
    // (framework errors leave suites at idle, so they aren't reflected in the ledger)
    const totals = aggregateLedgers(frameworks)
    if (frameworkErrors.size > 0) {
        totals.error += frameworkErrors.size
        totals.idle = Math.max(0, totals.idle - frameworkErrors.size)
    }
    process.stdout.write(`Summary: ${formatSummary(totals, true)}\n`)

    // Write snapshot
    const outputPath = args.output || defaultOutputPath(projectInfo.name!)
    const overrides: Record<string, string[]> = {}
    if (args.repos.length > 0) {
        overrides.repositoryTargets = args.repos
    }
    if (args.frameworks.length > 0) {
        overrides.frameworkTargets = args.frameworks
    }
    writeSnapshot(project, outputPath, app.getVersion(), overrides, args.compressed)
    process.stdout.write(`Output: ${outputPath}\n`)

    if (totals.error > 0) {
        return 2
    }
    if (totals.failed > 0) {
        return 1
    }
    return 0
}

/**
 * Remove a project by name or UUID.
 * Returns 0 on success.
 */
export function removeProject(nameOrId: string): number {
    const projectInfo = findProject(nameOrId)
    state.removeProject(projectInfo.id!)
    process.stdout.write(`Removed project: ${projectInfo.name}\n`)
    return 0
}

/**
 * List all available projects with their repositories and frameworks.
 * Returns 0 on success.
 */
export async function listProjects(): Promise<number> {
    const projects = state.getAvailableProjects()

    if (projects.length === 0) {
        process.stdout.write('No projects found.\n')
        process.stdout.write('Create one with: lode create --repository <path>\n')
        return 0
    }

    process.stdout.write(`Lode v${app.getVersion()} — Projects\n\n`)

    for (let i = 0; i < projects.length; i++) {
        const projectInfo = projects[i]
        const isLast = i === projects.length - 1
        const prefix = isLast ? '└─' : '├─'

        process.stdout.write(`${prefix} ${projectInfo.name}\n`)

        // Load the project to get repositories and frameworks
        const headlessWindow = new HeadlessWindow()
        const project = new Project(asApplicationWindow(headlessWindow), { id: projectInfo.id })

        // Wait for project to be ready with a timeout
        await new Promise<void>((resolve) => {
            const timeout = setTimeout(() => {
                process.stderr.write(`   Warning: Project "${projectInfo.name}" failed to load\n`)
                resolve()
            }, 10_000)

            project.on('ready', () => {
                clearTimeout(timeout)
                resolve()
            })
        })

        const repositories = project.repositories
        const continuation = isLast ? '  ' : '│ '

        if (repositories.length === 0) {
            process.stdout.write(`${continuation}  (no repositories)\n`)
        }
        else {
            for (let j = 0; j < repositories.length; j++) {
                const repo = repositories[j]
                const isLastRepo = j === repositories.length - 1
                const repoPrefix = isLastRepo ? '└─' : '├─'

                process.stdout.write(`${continuation}  ${repoPrefix} ${repo.getPath()}\n`)

                const frameworks = repo.frameworks as IFramework[]
                const repoContinuation = isLastRepo ? '   ' : '│  '

                if (frameworks.length === 0) {
                    process.stdout.write(`${continuation}  ${repoContinuation}   (no frameworks)\n`)
                }
                else {
                    for (let k = 0; k < frameworks.length; k++) {
                        const fw = frameworks[k]
                        const isLastFw = k === frameworks.length - 1
                        const fwPrefix = isLastFw ? '└─' : '├─'
                        const suites = fw.getSuites()

                        process.stdout.write(
                            `${continuation}  ${repoContinuation}   ${fwPrefix} ${fw.getDisplayName()} `
                            + `(${suites.length} suite${suites.length === 1 ? '' : 's'})\n`,
                        )
                    }
                }
            }
        }

        if (!isLast) {
            process.stdout.write('│\n')
        }
    }

    process.stdout.write('\n')
    return 0
}
