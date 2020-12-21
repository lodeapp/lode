import { EventEmitter } from 'events'
import pool from '@lib/process/pool'

describe('lib/process/ProcessPool', () => {
    beforeEach(() => {
        pool.clear()
    })

    it('can pool processes without specifying id', () => {
        const spawned = {
            getId: jest.fn().mockReturnValue(7),
            on: jest.fn()
        }
        pool.add(spawned)
        expect(pool.processes[7]).toBe(spawned)
        expect(spawned.getId).toHaveBeenCalledTimes(1)
        expect(spawned.on).toHaveBeenCalledTimes(1)
    })

    it('does not pool processes if it cannot figure out the process id', () => {
        const spawned = {
            getId: jest.fn().mockReturnValue(null),
            on: jest.fn()
        }
        pool.add(spawned)
        expect(pool.processes).toEqual({})
        expect(spawned.getId).toHaveBeenCalledTimes(1)
        expect(spawned.on).not.toHaveBeenCalled()
    })

    it('pools processes with a given id', () => {
        const spawned = {
            getId: jest.fn(),
            on: jest.fn()
        }
        pool.add(spawned, 11)
        expect(pool.processes[11]).toBe(spawned)
        expect(spawned.getId).not.toHaveBeenCalled()
        expect(spawned.on).toHaveBeenCalledTimes(1)
    })

    it('can find process in the current pool', () => {
        const spawned = {
            on: jest.fn()
        }
        pool.add(spawned, 11)
        expect(pool.findProcess(11)).toBe(spawned)
    })

    it('removes processes from the pool when they close', () => {
        const spawned = new EventEmitter()

        pool.add(spawned, 11)
        expect(pool.processes[11]).toBe(spawned)

        spawned.emit('close')
        expect(pool.processes[11]).toBe(undefined)
    })

    it('can handle removed processes on close', () => {
        const spawned = new EventEmitter()

        pool.add(spawned, 11)
        expect(pool.processes[11]).toBe(spawned)
        pool.clear()
        expect(pool.processes[11]).toBe(undefined)

        spawned.emit('close')
    })
})
