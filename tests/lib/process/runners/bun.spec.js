import { spawn } from 'node:child_process'
import { BunProcess } from '@lib/process/runners/bun'

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
    expect(BunProcess.owns('bun run test')).toBe(true)
    expect(BunProcess.owns('bun run tests')).toBe(true)
    expect(BunProcess.owns('bunx jest')).toBe(true)
    expect(BunProcess.owns('bun.exe run test')).toBe(true)
    expect(BunProcess.owns('bunx.exe jest')).toBe(true)
    expect(BunProcess.owns('npm run tests')).toBe(false)
    expect(BunProcess.owns('yarn tests')).toBe(false)
    expect(BunProcess.owns('abun run tests')).toBe(false)
    expect(BunProcess.owns('buna run tests')).toBe(false)
    expect(BunProcess.owns('bun tests')).toBe(false)
    expect(BunProcess.owns('bun exec jest')).toBe(false)
})

it('fails when called with empty command', () => {
    expect(() => new BunProcess({
        command: '',
    })).toThrow('Failed to determine process to run')
    expect(spawn).not.toHaveBeenCalled()
})

it('spawns run with no extra arguments', () => {
    const _bun = new BunProcess({
        command: 'bun run biscuit',
        platform: 'darwin',
    })
    expect(spawn).toHaveBeenCalledTimes(1)
    expect(spawn).toHaveBeenCalledWith(
        expect.any(String),
        ['-lc', 'bun run biscuit'],
        expect.any(Object),
    )
})

it('spawns run with proper arguments', () => {
    const _bun = new BunProcess({
        command: 'bun run biscuit --hobnobs --digestives rich=tea',
        platform: 'darwin',
    })
    expect(spawn).toHaveBeenCalledTimes(1)
    expect(spawn).toHaveBeenCalledWith(
        expect.any(String),
        ['-lc', 'bun run biscuit --hobnobs --digestives \'rich=tea\''],
        expect.any(Object),
    )
})

it('spawns bunx with no extra arguments', () => {
    const _bun = new BunProcess({
        command: 'bunx jest',
        platform: 'darwin',
    })
    expect(spawn).toHaveBeenCalledTimes(1)
    expect(spawn).toHaveBeenCalledWith(
        expect.any(String),
        ['-lc', 'bunx jest'],
        expect.any(Object),
    )
})

it('spawns bunx with proper arguments', () => {
    const _bun = new BunProcess({
        command: 'bunx jest --coverage --verbose',
        platform: 'darwin',
    })
    expect(spawn).toHaveBeenCalledTimes(1)
    expect(spawn).toHaveBeenCalledWith(
        expect.any(String),
        ['-lc', 'bunx jest --coverage --verbose'],
        expect.any(Object),
    )
})

it('amends bun binary in windows environments', () => {
    const _bun = new BunProcess({
        command: 'bun run biscuit --hobnobs',
        platform: 'win32',
    })
    expect(spawn).toHaveBeenCalledTimes(1)
    expect(spawn).toHaveBeenCalledWith(
        'bun.exe',
        ['run', 'biscuit', '--hobnobs'],
        expect.any(Object),
    )
})

it('amends bunx binary in windows environments', () => {
    const _bun = new BunProcess({
        command: 'bunx jest --coverage',
        platform: 'win32',
    })
    expect(spawn).toHaveBeenCalledTimes(1)
    expect(spawn).toHaveBeenCalledWith(
        'bunx.exe',
        ['jest', '--coverage'],
        expect.any(Object),
    )
})

it('respects binary in windows environments if extension is passed', () => {
    const _bun = new BunProcess({
        command: 'bun.exe run biscuit --hobnobs',
        platform: 'win32',
    })
    expect(spawn).toHaveBeenCalledTimes(1)
    expect(spawn).toHaveBeenCalledWith(
        'bun.exe',
        ['run', 'biscuit', '--hobnobs'],
        expect.any(Object),
    )
})
