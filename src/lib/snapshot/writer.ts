import type { IFramework } from '@lib/frameworks/framework'
import type { IProject } from '@lib/frameworks/project'
import type { IRepository } from '@lib/frameworks/repository'
import type { ISuite } from '@lib/frameworks/suite'
import type {
    SnapshotFile,
    SnapshotFrameworkData,
    SnapshotMetadata,
    SnapshotRepositoryData,
} from '@lib/snapshot/types'
import { Buffer } from 'node:buffer'
import { execSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { SNAPSHOT_VERSION } from '@lib/snapshot/types'

/**
 * Captures git branch and short commit SHA from a directory.
 */
function getGitInfo(cwd: string): { branch?: string, commit?: string } {
    try {
        const branchOutput = execSync('git rev-parse --abbrev-ref HEAD', { cwd, timeout: 5000 })
        const commitOutput = execSync('git rev-parse --short HEAD', { cwd, timeout: 5000 })
        return {
            branch: branchOutput.toString().trim(),
            commit: commitOutput.toString().trim(),
        }
    }
    catch {
        return {}
    }
}

/**
 * Serializes a framework into snapshot format, capturing only executed suites.
 */
function serializeFramework(framework: IFramework): SnapshotFrameworkData {
    const options = framework.render()
    const statuses = framework.getStatusMap()
    const executedSuites: ISuite[] = framework.getSuites().filter((suite: ISuite) => {
        const suiteStatus = statuses[suite.getId()]
        return suiteStatus && suiteStatus !== 'idle' && suiteStatus !== 'empty'
    })

    return {
        id: framework.getId(),
        name: framework.getDisplayName(),
        type: framework.type,
        command: options.command,
        path: framework.path,
        runsInRemote: framework.runsInRemote,
        remotePath: framework.remotePath,
        suites: executedSuites.map(suite => suite.persist(false)),
        ledger: framework.getLedger(),
        statuses,
        proprietary: options.proprietary,
        canToggleTests: framework.canToggleTests,
    }
}

/**
 * Serializes a repository into snapshot format.
 */
function serializeRepository(repository: IRepository): SnapshotRepositoryData {
    return {
        id: repository.getId(),
        name: repository.getDisplayName(),
        path: repository.getPath(),
        frameworks: repository.frameworks.map(serializeFramework),
    }
}

/**
 * Writes a project's test results to a .lode snapshot file.
 */
export function writeSnapshot(
    project: IProject,
    outputPath: string,
    lodeVersion: string,
    overrides?: Partial<SnapshotMetadata>,
    compressed = true,
): void {
    // Capture git info from the first repository that has a path
    const gitInfo = project.repositories.length > 0
        ? getGitInfo(project.repositories[0].getPath())
        : {}

    const metadata: SnapshotMetadata = {
        createdAt: new Date().toISOString(),
        lodeVersion,
        projectName: project.name,
        projectId: project.getId(),
        gitBranch: gitInfo.branch,
        gitCommit: gitInfo.commit,
        ...overrides,
    }

    const snapshot: SnapshotFile = {
        version: SNAPSHOT_VERSION,
        metadata,
        project: {
            id: project.getId(),
            name: project.name,
            repositories: project.repositories.map(serializeRepository),
        },
    }

    const json = JSON.stringify(snapshot)
    if (compressed) {
        writeFileSync(outputPath, gzipSync(Buffer.from(json, 'utf-8')))
    }
    else {
        writeFileSync(outputPath, json, 'utf-8')
    }
}
