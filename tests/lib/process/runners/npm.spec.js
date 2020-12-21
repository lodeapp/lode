import { spawn } from 'child_process'
import { NpmProcess } from '@lib/process/runners/npm'

jest.mock('child_process', () => ({
    spawn: jest.fn().mockReturnValue({
        on: jest.fn(),
        stdout: {
            setEncoding: jest.fn(),
            on: jest.fn()
        },
        stderr: {
            setEncoding: jest.fn(),
            on: jest.fn()
        }
    })
}))

describe('main/lib/process/runners/NpmProcess', () => {
    it('owns relevant commands', () => {
        expect(NpmProcess.owns('npm run tests')).toBe(true)
        expect(NpmProcess.owns('npm run test')).toBe(true)
        expect(NpmProcess.owns('yarn run tests')).toBe(false)
        expect(NpmProcess.owns('yarn tests')).toBe(false)
        expect(NpmProcess.owns('anpm run tests')).toBe(false)
        expect(NpmProcess.owns('npma run tests')).toBe(false)
        expect(NpmProcess.owns('npm.cmd run tests')).toBe(true)
        expect(NpmProcess.owns('npm.cmdx tests')).toBe(false)
        expect(NpmProcess.owns('inpm.cmd tests')).toBe(false)
        expect(NpmProcess.owns('yarn.cmd tests')).toBe(false)
        expect(NpmProcess.owns('yarn.js tests')).toBe(false)
    })

    it('fails when called with empty command', () => {
        expect(() => {
            new NpmProcess({
                command: ''
            })
        }).toThrow('Failed to determine process to run')
        expect(spawn).not.toHaveBeenCalled()
    })

    it('spawns with no arguments', () => {
        new NpmProcess({
            command: 'npm run biscuit',
            platform: 'darwin' // Force macOS to ensure binary is left intact.
        })
        expect(spawn).toHaveBeenCalledTimes(1)
        expect(spawn).toHaveBeenCalledWith(
            'npm',
            ['run', 'biscuit'],
            expect.any(Object)
        )
    })

    it('spawns with proper arguments', () => {
        new NpmProcess({
            command: 'npm run biscuit --hobnobs --digestives rich=tea',
            platform: 'darwin' // Force macOS to ensure binary is left intact.
        })
        expect(spawn).toHaveBeenCalledTimes(1)
        expect(spawn).toHaveBeenCalledWith(
            'npm',
            ['run', 'biscuit', '--', '--hobnobs', '--digestives', 'rich=tea'],
            // Ignore last argument, we'll assert relevant bits individually.
            expect.any(Object)
        )
    })

    it('amends binary in windows environments, if no extension is passed', () => {
        new NpmProcess({
            command: 'npm run biscuit --hobnobs --digestives rich=tea',
            platform: 'win32'
        })
        expect(spawn).toHaveBeenCalledTimes(1)
        expect(spawn).toHaveBeenCalledWith(
            'npm.cmd',
            ['run', 'biscuit', '--', '--hobnobs', '--digestives', 'rich=tea'],
            expect.any(Object)
        )
    })

    it('respects binary in windows environments if extension is passed', () => {
        new NpmProcess({
            command: 'npm.cmd run biscuit --hobnobs --digestives rich=tea',
            platform: 'win32'
        })
        expect(spawn).toHaveBeenCalledTimes(1)
        expect(spawn).toHaveBeenCalledWith(
            'npm.cmd',
            ['run', 'biscuit', '--', '--hobnobs', '--digestives', 'rich=tea'],
            expect.any(Object)
        )
    })

    it('spawns with proper environment', () => {
        const npm = new NpmProcess({ command: 'npm run biscuit --hobnobs --digestives rich=tea' })
        expect(npm.spawnEnv({ BISCUIT: 'HOBNOBS' })).toEqual({
            BISCUIT: 'HOBNOBS',
            NO_UPDATE_NOTIFIER: 1
        })
    })
})
