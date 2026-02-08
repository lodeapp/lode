import * as fs from 'node:fs'
import * as path from 'node:path'

const FIXTURES_DIR = path.resolve(__dirname, '../../fixtures')

export function loadFixture<T = any>(fixturePath: string): T {
    const fullPath = path.join(FIXTURES_DIR, fixturePath)
    return JSON.parse(fs.readFileSync(fullPath, 'utf-8'))
}
