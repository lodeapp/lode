import { buildExecCommand, buildScriptCommand, detectPackageManager } from '@lib/helpers/package-manager'

describe('detectPackageManager', () => {
    it('returns npm when no lock file is present', () => {
        expect(detectPackageManager(['package.json', 'README.md'])).toBe('npm')
    })

    it('returns npm when package-lock.json is present', () => {
        expect(detectPackageManager(['package.json', 'package-lock.json'])).toBe('npm')
    })

    it('returns yarn when yarn.lock is present', () => {
        expect(detectPackageManager(['package.json', 'yarn.lock'])).toBe('yarn')
    })

    it('returns pnpm when pnpm-lock.yaml is present', () => {
        expect(detectPackageManager(['package.json', 'pnpm-lock.yaml'])).toBe('pnpm')
    })

    it('returns bun when bun.lockb is present', () => {
        expect(detectPackageManager(['package.json', 'bun.lockb'])).toBe('bun')
    })

    it('returns bun when bun.lock is present', () => {
        expect(detectPackageManager(['package.json', 'bun.lock'])).toBe('bun')
    })

    it('returns npm for empty files list', () => {
        expect(detectPackageManager([])).toBe('npm')
    })

    it('prefers yarn over npm when both lock files exist', () => {
        expect(detectPackageManager(['yarn.lock', 'package-lock.json'])).toBe('yarn')
    })

    it('prefers pnpm over npm when both lock files exist', () => {
        expect(detectPackageManager(['pnpm-lock.yaml', 'package-lock.json'])).toBe('pnpm')
    })

    it('prefers bun over npm when both lock files exist', () => {
        expect(detectPackageManager(['bun.lockb', 'package-lock.json'])).toBe('bun')
    })
})

describe('buildScriptCommand', () => {
    it('builds npm script commands with run keyword', () => {
        expect(buildScriptCommand('npm', 'test')).toBe('npm run test')
    })

    it('builds yarn script commands without run keyword', () => {
        expect(buildScriptCommand('yarn', 'test')).toBe('yarn test')
    })

    it('builds pnpm script commands with run keyword', () => {
        expect(buildScriptCommand('pnpm', 'test')).toBe('pnpm run test')
    })

    it('builds bun script commands with run keyword', () => {
        expect(buildScriptCommand('bun', 'test')).toBe('bun run test')
    })

    it('preserves custom script names', () => {
        expect(buildScriptCommand('npm', 'test:unit')).toBe('npm run test:unit')
        expect(buildScriptCommand('yarn', 'test:unit')).toBe('yarn test:unit')
    })
})

describe('buildExecCommand', () => {
    it('builds npm exec commands using node_modules bin path', () => {
        expect(buildExecCommand('npm', 'jest')).toBe('./node_modules/.bin/jest')
    })

    it('builds yarn exec commands', () => {
        expect(buildExecCommand('yarn', 'jest')).toBe('yarn jest')
    })

    it('builds pnpm exec commands', () => {
        expect(buildExecCommand('pnpm', 'jest')).toBe('pnpm exec jest')
    })

    it('builds bun exec commands using bunx', () => {
        expect(buildExecCommand('bun', 'jest')).toBe('bunx jest')
    })

    it('works with any executable name', () => {
        expect(buildExecCommand('npm', 'vitest')).toBe('./node_modules/.bin/vitest')
        expect(buildExecCommand('yarn', 'vitest')).toBe('yarn vitest')
    })
})
