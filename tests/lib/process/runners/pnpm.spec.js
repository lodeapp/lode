import { spawn } from 'node:child_process'
import { PnpmProcess } from '@lib/process/runners/pnpm'

vi.mock('child_process', () => ({
    spawn: vi.fn().mockReturnValue({
        on: vi.fn(),
        stdout: {
            setEncoding: vi.fn(),
            on: vi.fn(),
        },
        stderr: {
            setEncoding: vi.fn(),
            on: vi.fn(),
        },
    }),
}))

it('owns relevant commands', () => {
    expect(PnpmProcess.owns('pnpm run tests')).toBe(true)
    expect(PnpmProcess.owns('pnpm run test')).toBe(true)
    expect(PnpmProcess.owns('pnpm exec jest')).toBe(true)
    expect(PnpmProcess.owns('pnpm.cmd run tests')).toBe(true)
    expect(PnpmProcess.owns('pnpm.cmd exec jest')).toBe(true)
    expect(PnpmProcess.owns('npm run tests')).toBe(false)
    expect(PnpmProcess.owns('yarn tests')).toBe(false)
    expect(PnpmProcess.owns('apnpm run tests')).toBe(false)
    expect(PnpmProcess.owns('pnpma run tests')).toBe(false)
    expect(PnpmProcess.owns('pnpm tests')).toBe(false)
    expect(PnpmProcess.owns('pnpm.cmdx run tests')).toBe(false)
})

it('fails when called with empty command', () => {
    expect(() => new PnpmProcess({
        command: '',
    })).toThrow('Failed to determine process to run')
    expect(spawn).not.toHaveBeenCalled()
})

it('spawns run with no extra arguments', () => {
    const _pnpm = new PnpmProcess({
        command: 'pnpm run biscuit',
        platform: 'darwin',
    })
    expect(spawn).toHaveBeenCalledTimes(1)
    expect(spawn).toHaveBeenCalledWith(
        'pnpm',
        ['run', 'biscuit'],
        expect.any(Object),
    )
})

it('spawns run with proper arguments', () => {
    const _pnpm = new PnpmProcess({
        command: 'pnpm run biscuit --hobnobs --digestives rich=tea',
        platform: 'darwin',
    })
    expect(spawn).toHaveBeenCalledTimes(1)
    expect(spawn).toHaveBeenCalledWith(
        'pnpm',
        ['run', 'biscuit', '--', '--hobnobs', '--digestives', 'rich=tea'],
        expect.any(Object),
    )
})

it('spawns exec with no extra arguments', () => {
    const _pnpm = new PnpmProcess({
        command: 'pnpm exec jest',
        platform: 'darwin',
    })
    expect(spawn).toHaveBeenCalledTimes(1)
    expect(spawn).toHaveBeenCalledWith(
        'pnpm',
        ['exec', 'jest'],
        expect.any(Object),
    )
})

it('spawns exec with proper arguments', () => {
    const _pnpm = new PnpmProcess({
        command: 'pnpm exec jest --coverage --verbose',
        platform: 'darwin',
    })
    expect(spawn).toHaveBeenCalledTimes(1)
    expect(spawn).toHaveBeenCalledWith(
        'pnpm',
        ['exec', 'jest', '--', '--coverage', '--verbose'],
        expect.any(Object),
    )
})

it('amends binary in windows environments, if no extension is passed', () => {
    const _pnpm = new PnpmProcess({
        command: 'pnpm run biscuit --hobnobs',
        platform: 'win32',
    })
    expect(spawn).toHaveBeenCalledTimes(1)
    expect(spawn).toHaveBeenCalledWith(
        'pnpm.cmd',
        ['run', 'biscuit', '--', '--hobnobs'],
        expect.any(Object),
    )
})

it('respects binary in windows environments if extension is passed', () => {
    const _pnpm = new PnpmProcess({
        command: 'pnpm.cmd run biscuit --hobnobs',
        platform: 'win32',
    })
    expect(spawn).toHaveBeenCalledTimes(1)
    expect(spawn).toHaveBeenCalledWith(
        'pnpm.cmd',
        ['run', 'biscuit', '--', '--hobnobs'],
        expect.any(Object),
    )
})

it('spawns with proper environment', () => {
    const pnpm = new PnpmProcess({ command: 'pnpm run biscuit' })
    expect(pnpm.spawnEnv({ BISCUIT: 'HOBNOBS' })).toEqual({
        BISCUIT: 'HOBNOBS',
        NO_UPDATE_NOTIFIER: 1,
    })
})
