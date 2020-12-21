import { spawn } from 'child_process'
import { YarnProcess } from '@lib/process/runners/yarn'

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

describe('main/lib/process/runners/YarnProcess', () => {
    it('owns relevant commands', (done) => {
        expect(YarnProcess.owns('yarn tests')).toBe(true)
        expect(YarnProcess.owns('yarn run tests')).toBe(true)
        expect(YarnProcess.owns('npm run test')).toBe(false)
        expect(YarnProcess.owns('yarna run tests')).toBe(false)
        expect(YarnProcess.owns('iyarn run tests')).toBe(false)
        expect(YarnProcess.owns('yarn.cmd tests')).toBe(true)
        expect(YarnProcess.owns('yarn.js tests')).toBe(true)
        expect(YarnProcess.owns('yarn.cmdx tests')).toBe(false)
        expect(YarnProcess.owns('yarn.jsx tests')).toBe(false)
        expect(YarnProcess.owns('iyarn.cmd tests')).toBe(false)
        expect(YarnProcess.owns('iyarn.js tests')).toBe(false)
        expect(YarnProcess.owns('npm.cmd run tests')).toBe(false)
        done()
    })

    it('fails when called with empty command', () => {
        expect(() => {
            new YarnProcess({
                command: ''
            })
        }).toThrow('Failed to determine process to run')
        expect(spawn).not.toHaveBeenCalled()
    })

    it('spawns with no arguments', () => {
        new YarnProcess({
            command: 'yarn biscuit',
            platform: 'darwin' // Force macOS to ensure binary is left intact.
        })
        expect(spawn).toHaveBeenCalledTimes(1)
        expect(spawn).toHaveBeenCalledWith(
            'yarn',
            ['biscuit'],
            expect.any(Object)
        )
    })

    it('spawns with proper arguments', () => {
        new YarnProcess({
            command: 'yarn biscuit --hobnobs --digestives rich=tea',
            platform: 'darwin' // Force macOS to ensure binary is left intact.
        })
        expect(spawn).toHaveBeenCalledTimes(1)
        expect(spawn).toHaveBeenCalledWith(
            'yarn',
            ['biscuit', '--hobnobs', '--digestives', 'rich=tea'],
            // Ignore last argument, we'll assert relevant bits individually.
            expect.any(Object)
        )
    })

    it('amends binary in windows environments, if no extension is passed', () => {
        new YarnProcess({
            command: 'yarn biscuit --hobnobs --digestives rich=tea',
            platform: 'win32'
        })
        expect(spawn).toHaveBeenCalledTimes(1)
        expect(spawn).toHaveBeenCalledWith(
            'yarn.cmd',
            ['biscuit', '--hobnobs', '--digestives', 'rich=tea'],
            expect.any(Object)
        )
    })

    it('respects binary in windows environments if extension is passed', () => {
        new YarnProcess({
            command: 'yarn.js biscuit --hobnobs --digestives rich=tea',
            platform: 'win32'
        })
        expect(spawn).toHaveBeenCalledTimes(1)
        expect(spawn).toHaveBeenCalledWith(
            'yarn.js',
            ['biscuit', '--hobnobs', '--digestives', 'rich=tea'],
            expect.any(Object)
        )
    })
})
