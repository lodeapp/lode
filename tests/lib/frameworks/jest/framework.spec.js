import { Jest } from '@lib/frameworks/jest/framework'
import * as Fs from 'fs-extra'

vi.mock('fs-extra', () => ({
    readJson: vi.fn(),
}))
vi.mock('@lib/state')
vi.mock('electron-store')
vi.mock('@main/application-window')

const hydratedDefaults = {
    name: 'Jest',
    path: '',
    proprietary: {},
    runsInRemote: false,
    type: 'jest',
}

// ── Negative cases ──────────────────────────────────────────────

it('does not spawn Jest framework for empty repository', async () => {
    expect(await Jest.spawnForDirectory({ files: [], path: '' })).toBe(false)
})

it('does not spawn Jest framework for repository not containing package.json', async () => {
    expect(await Jest.spawnForDirectory({ files: ['biscuit.json'], path: '' })).toBe(false)
    expect(await Jest.spawnForDirectory({ files: ['apackage.json'], path: '' })).toBe(false)
    expect(await Jest.spawnForDirectory({ files: ['packagez.json'], path: '' })).toBe(false)
    expect(await Jest.spawnForDirectory({ files: ['package.zip'], path: '' })).toBe(false)
})

it('does not spawn Jest framework for repository with package.json without scripts', async () => {
    Fs.readJson.mockReturnValue({
        biscuits: {},
    })
    expect(await Jest.spawnForDirectory({ files: ['package.json'], path: 'biscuits' })).toBe(false)
})

it.each([
    'cross-env NODE_ENV=production webpack --mode production --config webpack.jest.config.js',
    'webpack --mode production --config webpack.jest.config.js',
    'jjest',
    'jxest',
    'jestz',
    'jest.config.js',
    'hest',
    'jest.test',
    'pack:jest',
    'hey',
])('does not spawn Jest framework for repository with package.json script "%s"', async (script) => {
    Fs.readJson.mockReturnValue({
        scripts: {
            script,
        },
    })
    expect(await Jest.spawnForDirectory({ files: ['package.json'], path: 'biscuits' })).toBe(false)
})

it('does not detect jest from similarly named config files', async () => {
    Fs.readJson.mockReturnValue({})
    expect(await Jest.spawnForDirectory({
        files: ['package.json', 'jest.config.yaml', 'jest.setup.js'],
        path: 'biscuits',
    })).toBe(false)
})

// ── Script detection (npm default, no lock file) ───────────────

it.each([
    './node_modules/jest/bin/jest.js',
    'C:\\node_modules\\jest\\bin\\jest.js',
    'jest.js',
    'jest',
    'jest --hey --ho',
])('spawns Jest framework for repository with package.json script "%s"', async (script) => {
    Fs.readJson.mockReturnValue({
        scripts: {
            script,
        },
    })
    expect(await Jest.spawnForDirectory({ files: ['package.json'], path: 'biscuits' })).toEqual({
        ...hydratedDefaults,
        command: 'npm run script',
    })
})

it('spawns Jest framework from the first script and uses its key', async () => {
    Fs.readJson.mockReturnValue({
        scripts: {
            one: 'jest',
            two: 'jest',
        },
    })
    const options = await Jest.spawnForDirectory({ files: ['package.json'], path: 'biscuits' })
    expect(options.command).toBe('npm run one')
})

// ── Script detection respects package manager ──────────────────

it('uses yarn command when yarn.lock is present', async () => {
    Fs.readJson.mockReturnValue({
        scripts: { test: 'jest' },
    })
    const options = await Jest.spawnForDirectory({
        files: ['package.json', 'yarn.lock'],
        path: 'biscuits',
    })
    expect(options.command).toBe('yarn test')
})

it('uses npm command when package-lock.json is present', async () => {
    Fs.readJson.mockReturnValue({
        scripts: { test: 'jest' },
    })
    const options = await Jest.spawnForDirectory({
        files: ['package.json', 'package-lock.json'],
        path: 'biscuits',
    })
    expect(options.command).toBe('npm run test')
})

it('uses pnpm command when pnpm-lock.yaml is present', async () => {
    Fs.readJson.mockReturnValue({
        scripts: { test: 'jest' },
    })
    const options = await Jest.spawnForDirectory({
        files: ['package.json', 'pnpm-lock.yaml'],
        path: 'biscuits',
    })
    expect(options.command).toBe('pnpm run test')
})

it('uses bun command when bun.lockb is present', async () => {
    Fs.readJson.mockReturnValue({
        scripts: { test: 'jest' },
    })
    const options = await Jest.spawnForDirectory({
        files: ['package.json', 'bun.lockb'],
        path: 'biscuits',
    })
    expect(options.command).toBe('bun run test')
})

// ── Jest config key in package.json ────────────────────────────

it('spawns from jest config key in package.json with detected package manager', async () => {
    Fs.readJson.mockReturnValue({
        jest: { testMatch: ['**/*.test.js'] },
    })
    const options = await Jest.spawnForDirectory({
        files: ['package.json', 'yarn.lock'],
        path: 'biscuits',
    })
    expect(options.command).toBe('yarn jest')
})

it('spawns from jest config key in package.json with npm default', async () => {
    Fs.readJson.mockReturnValue({
        jest: { testMatch: ['**/*.test.js'] },
    })
    const options = await Jest.spawnForDirectory({
        files: ['package.json'],
        path: 'biscuits',
    })
    expect(options.command).toBe('./node_modules/.bin/jest')
})

// ── Standalone config file detection ───────────────────────────

it.each([
    'jest.config.js',
    'jest.config.ts',
    'jest.config.cjs',
    'jest.config.mjs',
    'jest.config.json',
])('spawns Jest framework when %s config file exists', async (configFile) => {
    expect(await Jest.spawnForDirectory({
        files: [configFile],
        path: 'biscuits',
    })).toEqual({
        ...hydratedDefaults,
        command: './node_modules/.bin/jest',
    })
})

it('spawns from config file with detected package manager', async () => {
    const options = await Jest.spawnForDirectory({
        files: ['jest.config.ts', 'pnpm-lock.yaml'],
        path: 'biscuits',
    })
    expect(options.command).toBe('pnpm exec jest')
})

it('spawns from config file with bun when bun.lock is present', async () => {
    const options = await Jest.spawnForDirectory({
        files: ['jest.config.js', 'bun.lock'],
        path: 'biscuits',
    })
    expect(options.command).toBe('bunx jest')
})

// ── Detection priority ─────────────────────────────────────────

it('prefers script over jest config key and config file', async () => {
    Fs.readJson.mockReturnValue({
        scripts: { test: 'jest --coverage' },
        jest: { testMatch: ['**/*.test.js'] },
    })
    const options = await Jest.spawnForDirectory({
        files: ['package.json', 'jest.config.js', 'yarn.lock'],
        path: 'biscuits',
    })
    expect(options.command).toBe('yarn test')
})

it('prefers jest config key over standalone config file', async () => {
    Fs.readJson.mockReturnValue({
        jest: { testMatch: ['**/*.test.js'] },
    })
    const options = await Jest.spawnForDirectory({
        files: ['package.json', 'jest.config.js', 'yarn.lock'],
        path: 'biscuits',
    })
    expect(options.command).toBe('yarn jest')
})
