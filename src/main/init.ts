import type { FrameworkOptions } from '@lib/frameworks/framework'
import type { CreateCommand } from '@main/cli'
import * as Path from 'node:path'
import { Project } from '@lib/frameworks/project'
import { asApplicationWindow, HeadlessWindow } from '@main/headless-window'
import { app } from 'electron'

/**
 * Format a simple column-aligned text table.
 */
export function formatTable(
    headers: string[],
    rows: string[][],
): string {
    if (rows.length === 0) {
        return ''
    }

    const widths = headers.map((h, i) =>
        Math.max(h.length, ...rows.map(r => (r[i] || '').length)),
    )

    const pad = (str: string, width: number) => str.padEnd(width)
    const headerLine = headers.map((h, i) => pad(h, widths[i])).join('    ')
    const separator = widths.map(w => '-'.repeat(w)).join('    ')
    const body = rows.map(row =>
        row.map((cell, i) => pad(cell || '', widths[i])).join('    '),
    ).join('\n')

    return `${headerLine}\n${separator}\n${body}`
}

/**
 * Create a new project from CLI arguments, scanning repositories
 * for frameworks automatically.
 * Returns the process exit code: 0 = success, 1 = validation error.
 */
export async function runInit(args: CreateCommand): Promise<number> {
    // Resolve and validate all repository paths up front
    const resolvedPaths: string[] = []
    const missing: string[] = []

    for (const repoPath of args.repos) {
        const resolved = Path.resolve(repoPath)
        try {
            const Fs = await import('node:fs')
            Fs.accessSync(resolved, Fs.constants.R_OK)
            resolvedPaths.push(resolved)
        }
        catch {
            missing.push(resolved)
        }
    }

    if (missing.length > 0) {
        process.stderr.write('Error: the following repository paths were not found:\n')
        for (const p of missing) {
            process.stderr.write(`  ${p}\n`)
        }
        return 1
    }

    // Determine project name
    const projectName = args.project || Path.basename(resolvedPaths[0])

    process.stdout.write(`Lode v${app.getVersion()} — Project Init\n\n`)

    // Create project
    const headlessWindow = new HeadlessWindow()
    const project = new Project(asApplicationWindow(headlessWindow), { name: projectName })

    // Wait for the project to become ready (fires immediately for 0-repo projects)
    await new Promise<void>((resolve) => {
        project.on('ready', () => {
            resolve()
        })
    })

    // Add repositories and scan for frameworks
    for (const repoPath of resolvedPaths) {
        const repository = await project.addRepository({ path: repoPath })

        const scannedFrameworks = await repository.scan()

        for (const options of scannedFrameworks) {
            await repository.addFramework(options)
        }
    }

    // Save the full project tree
    project.save()

    // Print summary
    process.stdout.write(`Project: ${projectName}\n`)
    process.stdout.write(`ID:      ${project.getId()}\n`)

    for (const repo of project.repositories) {
        process.stdout.write(`\n  Repository: ${repo.getDisplayName()}\n`)
        process.stdout.write(`  Path:       ${repo.getPath()}\n`)
        process.stdout.write(`  ID:         ${repo.getId()}\n`)

        if (repo.frameworks.length === 0) {
            process.stdout.write('  Frameworks: (none detected)\n')
        }
        else {
            process.stdout.write('  Frameworks:\n')
            const headers = ['Name', 'Type', 'Command', 'ID']
            const rows: string[][] = repo.frameworks.map((fw) => {
                const rendered = fw.persist() as FrameworkOptions
                return [
                    fw.getDisplayName(),
                    rendered.type || '',
                    rendered.command || '',
                    fw.getId(),
                ]
            })
            const table = formatTable(headers, rows)
            for (const line of table.split('\n')) {
                process.stdout.write(`    ${line}\n`)
            }
        }
    }

    // Print bare project UUID on last line for scripting
    process.stdout.write(`\n${project.getId()}\n`)

    return 0
}
