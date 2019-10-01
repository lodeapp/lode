import { spawn } from 'child_process'

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

import { NpmProcess } from '@lib/process/runners/npm'

beforeAll(() => {
    // Capture calls to the global logger and suppress console logs.
    global.log = {
        debug () {},
        info () {},
        warn () {},
        error () {}
    }
})

describe('main/lib/process/runners/NpmProcess', () => {
    it('owns relevant commands', () => {
        expect(NpmProcess.owns('npm run tests')).toBe(true)
        expect(NpmProcess.owns('npm run test')).toBe(true)
        expect(NpmProcess.owns('yarn run tests')).toBe(false)
        expect(NpmProcess.owns('yarn tests')).toBe(false)
        expect(NpmProcess.owns('anpm run tests')).toBe(false)
        expect(NpmProcess.owns('npma run tests')).toBe(false)
    })

    it('spawns with proper arguments', () => {
        new NpmProcess({ command: 'npm run biscuit --hobnobs --digestives rich=tea' })
        expect(spawn).toHaveBeenCalledTimes(1)
        expect(spawn).toHaveBeenCalledWith(
            'npm',
            ['run', 'biscuit', '--', '--hobnobs', '--digestives', 'rich=tea'],
            // Ignore last argument, we'll assert relevant bits individually.
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
