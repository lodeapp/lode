import { EventEmitter } from 'node:events'
import pool from '@lib/process/pool'

beforeEach(() => {
    pool.clear()
})

it('can pool processes without specifying id', () => {
    const spawned = {
        getId: vi.fn().mockReturnValue(7),
        on: vi.fn(),
    }
    pool.add(spawned)
    expect(pool.processes[7]).toBe(spawned)
    expect(spawned.getId).toHaveBeenCalledTimes(1)
    expect(spawned.on).toHaveBeenCalledTimes(1)
})

it('does not pool processes if it cannot figure out the process id', () => {
    const spawned = {
        getId: vi.fn().mockReturnValue(null),
        on: vi.fn(),
    }
    pool.add(spawned)
    expect(pool.processes).toEqual({})
    expect(spawned.getId).toHaveBeenCalledTimes(1)
    expect(spawned.on).not.toHaveBeenCalled()
})

it('pools processes with a given id', () => {
    const spawned = {
        getId: vi.fn(),
        on: vi.fn(),
    }
    pool.add(spawned, 11)
    expect(pool.processes[11]).toBe(spawned)
    expect(spawned.getId).not.toHaveBeenCalled()
    expect(spawned.on).toHaveBeenCalledTimes(1)
})

it('can find process in the current pool', () => {
    const spawned = {
        on: vi.fn(),
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

it('returns undefined when finding a non-existent process', () => {
    expect(pool.findProcess(999)).toBeUndefined()
})

it('can manage multiple processes simultaneously', () => {
    const spawned1 = { on: vi.fn() }
    const spawned2 = { on: vi.fn() }
    const spawned3 = { on: vi.fn() }

    pool.add(spawned1, 1)
    pool.add(spawned2, 2)
    pool.add(spawned3, 3)

    expect(pool.findProcess(1)).toBe(spawned1)
    expect(pool.findProcess(2)).toBe(spawned2)
    expect(pool.findProcess(3)).toBe(spawned3)
})

it('replaces a process when adding with an existing id', () => {
    const spawned1 = { on: vi.fn() }
    const spawned2 = { on: vi.fn() }

    pool.add(spawned1, 11)
    pool.add(spawned2, 11)

    expect(pool.findProcess(11)).toBe(spawned2)
})

it('removes only the specified process', () => {
    const spawned1 = { on: vi.fn() }
    const spawned2 = { on: vi.fn() }

    pool.add(spawned1, 1)
    pool.add(spawned2, 2)
    pool.remove(1)

    expect(pool.findProcess(1)).toBeUndefined()
    expect(pool.findProcess(2)).toBe(spawned2)
})

it('does not throw when removing a non-existent process', () => {
    expect(() => pool.remove(999)).not.toThrow()
})
