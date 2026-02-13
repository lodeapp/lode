import type { SnapshotFile } from '@lib/snapshot/types'
import type { Buffer } from 'node:buffer'
import { readFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
import { SNAPSHOT_VERSION } from '@lib/snapshot/types'

/**
 * Reads a .lode snapshot file, returning the parsed data.
 * Supports both gzip-compressed and plain JSON formats.
 * Throws descriptive errors for malformed or incompatible files.
 */
export function readSnapshot(filePath: string): SnapshotFile {
    let buffer: Buffer
    try {
        buffer = readFileSync(filePath)
    }
    catch (error: any) {
        throw new Error(`Unable to read snapshot file: ${error.message}`)
    }

    let json: string
    let decompressed = false
    try {
        json = gunzipSync(buffer).toString('utf-8')
        decompressed = true
    }
    catch {
        // Not gzip — try reading as plain JSON
        json = buffer.toString('utf-8')
    }

    let data: SnapshotFile
    try {
        data = JSON.parse(json)
    }
    catch {
        throw new Error(
            decompressed
                ? 'Snapshot file contains invalid JSON.'
                : 'Snapshot file is not a valid Lode or JSON file.',
        )
    }

    if (!data.version) {
        throw new Error('Snapshot file is missing a version field.')
    }

    if (data.version > SNAPSHOT_VERSION) {
        throw new Error(
            `Snapshot file version ${data.version} is newer than this version of Lode supports (${SNAPSHOT_VERSION}). Please update Lode.`,
        )
    }

    if (!data.metadata || !data.project) {
        throw new Error('Snapshot file is missing required fields (metadata or project).')
    }

    return data
}
