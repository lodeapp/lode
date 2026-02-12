import type { StatusLedger, StatusMap } from '@lib/frameworks/status'
import type { ISuiteResult } from '@lib/frameworks/suite'

/**
 * Schema version for the snapshot file format.
 */
export const SNAPSHOT_VERSION = 1

/**
 * File extension for snapshot files.
 */
export const SNAPSHOT_EXTENSION = '.lode'

/**
 * Metadata about the snapshot: when, where, and how it was created.
 */
export interface SnapshotMetadata {
    createdAt: string
    lodeVersion: string
    projectName: string
    projectId: string
    gitBranch?: string
    gitCommit?: string
    totalDuration?: number
    repositoryTargets?: string[]
    frameworkTargets?: string[]
}

/**
 * A repository as stored in a snapshot file.
 */
export interface SnapshotRepositoryData {
    id: string
    name: string
    path: string
    frameworks: SnapshotFrameworkData[]
}

/**
 * A framework as stored in a snapshot file.
 */
export interface SnapshotFrameworkData {
    id: string
    name: string
    type: string
    command: string
    path: string
    runsInRemote?: boolean
    remotePath?: string | null
    suites: ISuiteResult[]
    ledger: StatusLedger
    statuses: StatusMap
    proprietary: any
    canToggleTests: boolean
}

/**
 * The complete snapshot file structure.
 */
export interface SnapshotFile {
    version: number
    metadata: SnapshotMetadata
    project: {
        id: string
        name: string
        repositories: SnapshotRepositoryData[]
    }
}
