import { ProcessFactory } from '@lib/process/factory'
import { DefaultProcess } from '@lib/process/process'
import { NpmProcess } from '@lib/process/runners/npm'
import { YarnProcess } from '@lib/process/runners/yarn'
import pool from '@lib/process/pool'

jest.mock('@lib/process/pool')
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

describe('lib/process/ProcessFactory', () => {
    it('can make new processes', () => {
        const spawned = ProcessFactory.make({
            command: 'biscuit'
        })
        expect(spawned).toBeInstanceOf(DefaultProcess)
        expect(pool.add).toHaveBeenCalledTimes(1)
        expect(pool.add).toHaveBeenCalledWith(spawned, undefined)
    })

    it('can pool new processes with specific ids', () => {
        const spawned = ProcessFactory.make({
            command: 'biscuit'
        }, 42)
        expect(spawned).toBeInstanceOf(DefaultProcess)
        expect(pool.add).toHaveBeenCalledTimes(1)
        expect(pool.add).toHaveBeenCalledWith(spawned, 42)
    })

    it('can make specific processes by parsing command', () => {
        const npm = ProcessFactory.make({
            command: 'npm run biscuit'
        })
        expect(npm).toBeInstanceOf(NpmProcess)
        expect(pool.add).toHaveBeenLastCalledWith(npm, undefined)

        const yarn = ProcessFactory.make({
            command: 'yarn biscuit'
        })
        expect(yarn).toBeInstanceOf(YarnProcess)
        expect(pool.add).toHaveBeenLastCalledWith(yarn, undefined)

        expect(pool.add).toHaveBeenCalledTimes(2)
    })

    it('can force a specific runner from the options', () => {
        const yarn = ProcessFactory.make({
            command: 'npm run biscuit',
            forceRunner: 'yarn'
        })
        expect(yarn).toBeInstanceOf(YarnProcess)
        expect(pool.add).toHaveBeenCalledTimes(1)
        expect(pool.add).toHaveBeenCalledWith(yarn, undefined)
    })

    it('falls back to default process if forced runner does not exist', () => {
        const spawned = ProcessFactory.make({
            command: 'biscuit',
            forceRunner: 'cake'
        })
        expect(spawned).toBeInstanceOf(DefaultProcess)
        expect(pool.add).toHaveBeenCalledTimes(1)
        expect(pool.add).toHaveBeenCalledWith(spawned, undefined)
    })

    it('passes options from factory to process', () => {
        const spawned = ProcessFactory.make({
            command: 'biscuit',
            args: ['hobnobs', 'digestives'],
            ssh: false,
            sshOptions: {
                host: 'mcvities'
            },
            platform: 'linux'
        })
        expect(spawned).toBeInstanceOf(DefaultProcess)
        expect(spawned.command).toBe('biscuit')
        expect(spawned.args).toEqual(['hobnobs', 'digestives'])
        expect(spawned.platform).toBe('linux')
    })
})
