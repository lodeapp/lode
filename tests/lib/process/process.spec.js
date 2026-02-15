import { spawn } from 'node:child_process'
import * as Path from 'node:path'
import { DefaultProcess } from '@lib/process/process'
import * as fs from 'fs-extra'
import kill from 'tree-kill'

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

vi.mock('tree-kill', () => ({ default: vi.fn() }))

const fixtures = Path.join(__dirname, '../../fixtures/process')
const decoded = fs.readJsonSync(Path.join(__dirname, '../../fixtures/process/decoded.json'))

it('spawns processes', () => {
    const spawned = new DefaultProcess({
        path: 'pantry',
        command: 'biscuit --hobnobs --digestives rich=tea',
        ssh: false,
        platform: 'darwin', // Pin platform so login-shell wrapping is consistent on Windows CI.
    })
    expect(spawn).toHaveBeenCalledTimes(1)
    expect(spawn).toHaveBeenCalledWith(
        expect.any(String),
        ['-lc', 'biscuit --hobnobs --digestives \'rich=tea\''],
        // Ignore last argument, we'll assert relevant bits individually.
        expect.any(Object),
    )

    const options = spawn.mock.calls[0][2]
    expect(options.cwd).toBe('pantry')
    expect(options.detached).toBe(false)
    expect(options.shell).toBe(false)
    expect(options.windowsHide).toBe(true)
    expect(options.env).toEqual(expect.objectContaining({
        NODE_ENV: 'test', // Default for spawned test processes.
        FORCE_COLOR: 3, // Adds process overrides.
    }))

    expect(spawned.process.stdout.setEncoding).toHaveBeenCalledTimes(1)
    expect(spawned.process.stdout.setEncoding).toHaveBeenCalledWith('utf8')
    expect(spawned.process.stderr.setEncoding).toHaveBeenCalledTimes(1)
    expect(spawned.process.stderr.setEncoding).toHaveBeenCalledWith('utf8')
})

it('emits decoded reports', async () => {
    process.env.FROM_FILE = Path.join(fixtures, '1.json')
    const spy = vi.fn()
    const spawned = new DefaultProcess()
        .on('report', spy)
    await new Promise(resolve => process.nextTick(resolve))
    expect(spy.mock.calls.length).toBe(1)
    expect(spy.mock.calls[0][0].report).toEqual(decoded)
    expect(spawned.reportClosed).toBe(true)
})

it('can parse chunks with start delimiter', async () => {
    process.env.FROM_FILE = Path.join(fixtures, '2.json')
    const spy = vi.fn()
    new DefaultProcess()
        .on('report', spy)
    await new Promise(resolve => process.nextTick(resolve))
    expect(spy.mock.calls.length).toBe(1)
    expect(spy.mock.calls[0][0].report).toEqual(decoded)
})

it('can parse chunks with end delimiter', async () => {
    process.env.FROM_FILE = Path.join(fixtures, '3.json')
    const spy = vi.fn()
    new DefaultProcess()
        .on('report', spy)
    await new Promise(resolve => process.nextTick(resolve))
    expect(spy.mock.calls.length).toBe(1)
    expect(spy.mock.calls[0][0].report).toEqual(decoded)
})

it('can parse chunks with both delimiters', async () => {
    process.env.FROM_FILE = Path.join(fixtures, '4.json')
    const spy = vi.fn()
    new DefaultProcess()
        .on('report', spy)
    await new Promise(resolve => process.nextTick(resolve))
    expect(spy.mock.calls.length).toBe(1)
    expect(spy.mock.calls[0][0].report).toEqual(decoded)
})

it('can buffer chunks', async () => {
    process.env.FROM_FILE = Path.join(fixtures, '5.json')
    const spy = vi.fn()
    new DefaultProcess()
        .on('report', spy)
    await new Promise(resolve => process.nextTick(resolve))
    expect(spy.mock.calls.length).toBe(1)
    expect(spy.mock.calls[0][0].report).toEqual(decoded)
})

it('can buffer chunks with start delimiter', async () => {
    process.env.FROM_FILE = Path.join(fixtures, '6.json')
    const spy = vi.fn()
    new DefaultProcess()
        .on('report', spy)
    await new Promise(resolve => process.nextTick(resolve))
    expect(spy.mock.calls.length).toBe(1)
    expect(spy.mock.calls[0][0].report).toEqual(decoded)
})

it('can buffer chunks with end delimiter', async () => {
    process.env.FROM_FILE = Path.join(fixtures, '7.json')
    const spy = vi.fn()
    new DefaultProcess()
        .on('report', spy)
    await new Promise(resolve => process.nextTick(resolve))
    expect(spy.mock.calls.length).toBe(1)
    expect(spy.mock.calls[0][0].report).toEqual(decoded)
})

it('can buffer chunks with both delimiters', async () => {
    process.env.FROM_FILE = Path.join(fixtures, '8.json')
    const spy = vi.fn()
    new DefaultProcess()
        .on('report', spy)
    await new Promise(resolve => process.nextTick(resolve))
    expect(spy.mock.calls.length).toBe(1)
    expect(spy.mock.calls[0][0].report).toEqual(decoded)
})

it('can parse reports without whitespace in chunk', async () => {
    process.env.FROM_FILE = Path.join(fixtures, '9.json')
    const spy = vi.fn()
    new DefaultProcess()
        .on('report', spy)
    await new Promise(resolve => process.nextTick(resolve))
    expect(spy.mock.calls.length).toBe(1)
    expect(spy.mock.calls[0][0].report).toEqual(decoded)
})

it('can parse multiple reports in the same chunk', async () => {
    process.env.FROM_FILE = Path.join(fixtures, '10.json')
    const spy = vi.fn()
    new DefaultProcess()
        .on('report', spy)
    await new Promise(resolve => process.nextTick(resolve))
    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy.mock.calls[0][0].report).toEqual(decoded)
    expect(spy.mock.calls[1][0].report).toEqual(decoded)
})

it('can parse multiple reports in the same chunk with start delimiter', async () => {
    process.env.FROM_FILE = Path.join(fixtures, '11.json')
    const spy = vi.fn()
    new DefaultProcess()
        .on('report', spy)
    await new Promise(resolve => process.nextTick(resolve))
    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy.mock.calls[0][0].report).toEqual(decoded)
    expect(spy.mock.calls[1][0].report).toEqual(decoded)
})

it('can parse multiple reports in the same chunk with end delimiter', async () => {
    process.env.FROM_FILE = Path.join(fixtures, '12.json')
    const spy = vi.fn()
    new DefaultProcess()
        .on('report', spy)
    await new Promise(resolve => process.nextTick(resolve))
    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy.mock.calls[0][0].report).toEqual(decoded)
    expect(spy.mock.calls[1][0].report).toEqual(decoded)
})

it('can parse multiple reports in the same chunk with both delimiters', async () => {
    process.env.FROM_FILE = Path.join(fixtures, '13.json')
    const spy = vi.fn()
    new DefaultProcess()
        .on('report', spy)
    await new Promise(resolve => process.nextTick(resolve))
    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy.mock.calls[0][0].report).toEqual(decoded)
    expect(spy.mock.calls[1][0].report).toEqual(decoded)
})

it('can parse multiple reports in the same chunk with stray whitespace', async () => {
    process.env.FROM_FILE = Path.join(fixtures, '14.json')
    const spy = vi.fn()
    new DefaultProcess()
        .on('report', spy)
    await new Promise(resolve => process.nextTick(resolve))
    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy.mock.calls[0][0].report).toEqual(decoded)
    expect(spy.mock.calls[1][0].report).toEqual(decoded)
})

it('can parse multiple buffered reports', async () => {
    process.env.FROM_FILE = Path.join(fixtures, '15.json')
    const spy = vi.fn()
    new DefaultProcess()
        .on('report', spy)
    await new Promise(resolve => process.nextTick(resolve))
    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy.mock.calls[0][0].report).toEqual(decoded)
    expect(spy.mock.calls[1][0].report).toEqual(decoded)
})

it('can buffer reports with chunked start wrapper', async () => {
    process.env.FROM_FILE = Path.join(fixtures, '16.json')
    const spy = vi.fn()
    new DefaultProcess()
        .on('report', spy)
    await new Promise(resolve => process.nextTick(resolve))
    expect(spy.mock.calls.length).toBe(1)
    expect(spy.mock.calls[0][0].report).toEqual(decoded)
})

it('can buffer reports with chunked end wrapper', async () => {
    process.env.FROM_FILE = Path.join(fixtures, '17.json')
    const spy = vi.fn()
    new DefaultProcess()
        .on('report', spy)
    await new Promise(resolve => process.nextTick(resolve))
    expect(spy.mock.calls.length).toBe(1)
    expect(spy.mock.calls[0][0].report).toEqual(decoded)
})

it('can buffer reports with chunked wrappers and padding', async () => {
    process.env.FROM_FILE = Path.join(fixtures, '18.json')
    const spy = vi.fn()
    new DefaultProcess()
        .on('report', spy)
    await new Promise(resolve => process.nextTick(resolve))
    expect(spy.mock.calls.length).toBe(1)
    expect(spy.mock.calls[0][0].report).toEqual(decoded)
})

it('stores only stray content, not report content', async () => {
    process.env.FROM_FILE = Path.join(fixtures, '19.json')
    const spy = vi.fn()
    const spawned = new DefaultProcess()
        .on('report', spy)
    await new Promise(resolve => process.nextTick(resolve))
    expect(spy.mock.calls.length).toBe(1)
    expect(spy.mock.calls[0][0].report).toEqual(decoded)
    expect(spawned.chunks).toEqual([
        'Starting...',
        '\n<<<REPORT{\n',
        '\n}REPORT>>>',
        'Ended!',
    ])
})

it('handles interrupted report streams', async () => {
    process.env.FROM_FILE = Path.join(fixtures, '20.json')
    const spy = vi.fn()
    const spawned = new DefaultProcess()
        .on('report', spy)
    await new Promise(resolve => process.nextTick(resolve))
    expect(spy.mock.calls.length).toBe(1)
    expect(spy.mock.calls[0][0].report).toEqual(decoded)
    expect(spawned.chunks).toEqual([
        'Starting...',
        '\n<<<REPORT{\n',
        'Ended!',
    ])
    expect(spawned.reportClosed).toBe(false)

    // Force the process to close again, this time with an error exit
    // code, to ensure error message is well built.
    expect(() => {
        spawned.close(-1)
    }).toThrow()
    expect(spawned.error).toBe('Starting...\n<<<REPORT{\nEnded!')
})

it('handles interrupted report streams, with final output in same chunk as report', async () => {
    process.env.FROM_FILE = Path.join(fixtures, '21.json')
    const spy = vi.fn()
    const spawned = new DefaultProcess()
        .on('report', spy)
    await new Promise(resolve => process.nextTick(resolve))
    expect(spy.mock.calls.length).toBe(1)
    expect(spy.mock.calls[0][0].report).toEqual(decoded)
    // Raw chunk store will not contain the ending message, as it is
    // mixed with the report chunk itself, but we *should* still be
    // capable of outputting it in the error message.
    expect(spawned.chunks).toEqual([
        'Starting...',
        '\n<<<REPORT{\n',
    ])
    expect(spawned.reportClosed).toBe(false)

    expect(() => {
        spawned.close(-1)
    }).toThrow()

    // Even though it isn't in the raw chunk store, final message must
    // show in the error property after process closes with non-zero code.
    expect(spawned.error).toBe('Starting...\n<<<REPORT{\nEnded!')
})

it('can get the lines from a closed process', async () => {
    process.env.FROM_FILE = Path.join(fixtures, '22.json')
    const spawned = new DefaultProcess()
    await new Promise(resolve => process.nextTick(resolve))
    expect(spawned.getLines()).toEqual([
        'Starting...',
        'Ended!',
    ])
    expect(spawned.getRawLines()).toEqual([
        '\u001B[1mStarting...\u001B[0m',
        '\u001B[1mEnded!\u001B[0m',
    ])
})

it('can parse lines with carriage returns', async () => {
    process.env.FROM_FILE = Path.join(fixtures, '23.json')
    const spy = vi.fn()
    const spawned = new DefaultProcess()
        .on('report', spy)
    await new Promise(resolve => process.nextTick(resolve))
    expect(spy.mock.calls.length).toBe(1)
    expect(spy.mock.calls[0][0].report).toEqual(decoded)
    expect(spawned.reportClosed).toBe(true)
})

it('does not confuse object notations with delimiters', async () => {
    process.env.FROM_FILE = Path.join(fixtures, '24.json')
    const spy = vi.fn()
    const spawned = new DefaultProcess()
        .on('report', spy)
    await new Promise(resolve => process.nextTick(resolve))
    expect(spy.mock.calls.length).toBe(0)
    expect(spawned.reportClosed).toBe(false)

    expect(() => {
        spawned.close(-1)
    }).toThrow()

    // Even though it isn't in the raw chunk store, final message must
    // show in the error property after process closes with non-zero code.
    expect(spawned.error).toBe(`
<<<REPORT{
{
  hey: 'ho'
}`)
})

it('can detect start delimiters accross multiple lines regardless of whitespace', async () => {
    process.env.FROM_FILE = Path.join(fixtures, '25.json')
    const spy = vi.fn()
    const spawned = new DefaultProcess()
        .on('report', spy)
    await new Promise(resolve => process.nextTick(resolve))
    expect(spy.mock.calls.length).toBe(1)
    expect(spy.mock.calls[0][0].report).toEqual(decoded)
    expect(spawned.reportClosed).toBe(true)
})

it('can detect end delimiters accross multiple lines regardless of whitespace', async () => {
    process.env.FROM_FILE = Path.join(fixtures, '26.json')
    const spy = vi.fn()
    const spawned = new DefaultProcess()
        .on('report', spy)
    await new Promise(resolve => process.nextTick(resolve))
    expect(spy.mock.calls.length).toBe(1)
    expect(spy.mock.calls[0][0].report).toEqual(decoded)
    expect(spawned.reportClosed).toBe(true)
})

it('can detect start delimiters within gibberish strings', async () => {
    process.env.FROM_FILE = Path.join(fixtures, '27.json')
    const spy = vi.fn()
    const spawned = new DefaultProcess()
        .on('report', spy)
    await new Promise(resolve => process.nextTick(resolve))
    expect(spy.mock.calls.length).toBe(1)
    expect(spy.mock.calls[0][0].report).toEqual(decoded)
    expect(spawned.reportClosed).toBe(true)
})

it('can detect end delimiters within gibberish strings', async () => {
    process.env.FROM_FILE = Path.join(fixtures, '28.json')
    const spy = vi.fn()
    const spawned = new DefaultProcess()
        .on('report', spy)
    await new Promise(resolve => process.nextTick(resolve))
    expect(spy.mock.calls.length).toBe(1)
    expect(spy.mock.calls[0][0].report).toEqual(decoded)
    expect(spawned.reportClosed).toBe(true)
})

it('can buffer strings with parenthesis and exclude them from reports', async () => {
    process.env.FROM_FILE = Path.join(fixtures, '29.json')
    const spy = vi.fn()
    const spawned = new DefaultProcess()
        .on('report', spy)
    await new Promise(resolve => process.nextTick(resolve))
    expect(spy.mock.calls.length).toBe(1)
    expect(spy.mock.calls[0][0].report).toEqual(decoded)
    expect(spawned.chunks).toEqual([
        '\n<<<REPORT{',
        '\n(hey)',
        '\n(ho)',
        '\n({})',
        '\n(true)',
        '\n(isPromise(returnValue)',
        '}REPORT>>>',
    ])
})

describe('process spawning and lifecycle', () => {
    let childProcess

    beforeEach(() => {
        delete process.env.FROM_FILE
        childProcess = {
            on: vi.fn(),
            killed: false,
            pid: 12345,
            stdout: { setEncoding: vi.fn(), on: vi.fn() },
            stderr: { setEncoding: vi.fn(), on: vi.fn() },
        }
        spawn.mockReturnValue(childProcess)
    })

    function createProcess(opts = {}) {
        return new DefaultProcess({
            path: '/test',
            command: 'test-cmd',
            args: [],
            ssh: false,
            ...opts,
        })
    }

    function getChildListener(eventName) {
        const call = childProcess.on.mock.calls.find(c => c[0] === eventName)
        return call ? call[1] : null
    }

    it('throws when command is empty', () => {
        expect(() => new DefaultProcess({ command: '', args: [], path: '/test', ssh: false }))
            .toThrow('Failed to determine process to run')
    })

    it('handles ENOENT error by setting command not found message', () => {
        const spawned = createProcess()
        const errorHandler = getChildListener('error')
        errorHandler({ code: 'ENOENT', message: 'spawn ENOENT' })
        expect(spawned.error).toBe('test-cmd: command not found')
    })

    it('handles string error codes other than ENOENT by returning early', () => {
        const spawned = createProcess()
        const errorHandler = getChildListener('error')
        errorHandler({ code: 'EPERM', message: 'permission denied' })
        expect(spawned.error).toBe('')
    })

    it('handles numeric error codes by setting error message', () => {
        const spawned = createProcess()
        const errorHandler = getChildListener('error')
        errorHandler({ code: 1, message: 'Process exited with code 1' })
        expect(spawned.error).toBe('Process exited with code 1')
    })

    it('emits killed event when process was stopped', () => {
        const spawned = createProcess()
        const spy = vi.fn()
        spawned.on('killed', spy)
        spawned.stop()
        const closeHandler = getChildListener('close')
        closeHandler(null, 'SIGTERM')
        expect(spy).toHaveBeenCalledTimes(1)
        expect(spy.mock.calls[0][0].process).toBe(spawned)
    })

    it('emits killed event when child process was externally killed', () => {
        const spawned = createProcess()
        const spy = vi.fn()
        spawned.on('killed', spy)
        childProcess.killed = true
        const closeHandler = getChildListener('close')
        closeHandler(null, 'SIGTERM')
        expect(spy).toHaveBeenCalledTimes(1)
    })

    it('emits success event when exit code is 0', () => {
        const spawned = createProcess()
        const spy = vi.fn()
        spawned.on('success', spy)
        const closeHandler = getChildListener('close')
        closeHandler(0, null)
        expect(spy).toHaveBeenCalledTimes(1)
        expect(spy.mock.calls[0][0].process).toBe(spawned)
    })

    it('emits success event when report was closed even with non-zero exit code', () => {
        const spawned = createProcess()
        spawned.reports = true
        spawned.reportClosed = true
        const spy = vi.fn()
        spawned.on('success', spy)
        const closeHandler = getChildListener('close')
        closeHandler(1, null)
        expect(spy).toHaveBeenCalledTimes(1)
    })

    it('emits error event for non-zero exit code', () => {
        const spawned = createProcess()
        const spy = vi.fn()
        spawned.on('error', spy)
        const closeHandler = getChildListener('close')
        closeHandler(1, null)
        expect(spy).toHaveBeenCalledTimes(1)
        expect(spy.mock.calls[0][0].code).toBe(1)
    })

    it('builds error from chunks when no prior error set', () => {
        const spawned = createProcess()
        spawned.on('error', vi.fn())
        const dataHandler = childProcess.stdout.on.mock.calls.find(c => c[0] === 'data')[1]
        dataHandler('Line 1')
        dataHandler('Line 2')
        spawned.close(1, null)
        expect(spawned.error).toBe('Line 1Line 2')
    })

    it('includes reportBuffer in error when present', () => {
        const spawned = createProcess()
        spawned.on('error', vi.fn())
        spawned.reportBuffer = 'partial report data'
        spawned.close(1, null)
        expect(spawned.error).toContain('partial report data')
    })

    it('preserves prior error message on close', () => {
        const spawned = createProcess()
        spawned.on('error', vi.fn())
        const errorHandler = getChildListener('error')
        errorHandler({ code: 'ENOENT', message: 'spawn ENOENT' })
        spawned.close(1, null)
        expect(spawned.error).toBe('test-cmd: command not found')
    })

    it('stop sets killed flag and calls tree-kill', () => {
        const spawned = createProcess()
        spawned.stop()
        expect(spawned.killed).toBe(true)
        expect(kill).toHaveBeenCalledWith(12345)
    })

    it('stop without process does not throw', () => {
        const spawned = createProcess()
        spawned.process = undefined
        expect(() => spawned.stop()).not.toThrow()
        expect(spawned.killed).toBe(true)
    })

    it('owns always returns true for default process', () => {
        const spawned = createProcess()
        expect(spawned.owns('anything')).toBe(true)
        expect(spawned.owns('')).toBe(true)
    })

    it('toString serializes process state', () => {
        const spawned = createProcess()
        const str = spawned.toString()
        const parsed = JSON.parse(str)
        expect(parsed.command).toBe('test-cmd')
        expect(parsed.closed).toBe(false)
        expect(parsed.killed).toBe(false)
        expect(parsed.reports).toBe(false)
        expect(parsed.reportClosed).toBe(false)
    })

    it('tracks closed state and exit code after successful close', () => {
        const spawned = createProcess()
        spawned.close(0, null)
        expect(spawned.closed).toBe(true)
        expect(spawned.exitCode).toBe(0)
    })

    it('tracks exit signal after close', () => {
        const spawned = createProcess()
        spawned.killed = true
        spawned.close(null, 'SIGTERM')
        expect(spawned.exitSignal).toBe('SIGTERM')
    })

    it('emits close event after success', () => {
        const spawned = createProcess()
        const spy = vi.fn()
        spawned.on('close', spy)
        spawned.close(0, null)
        expect(spy).toHaveBeenCalledTimes(1)
    })

    it('emits close event after error', () => {
        const spawned = createProcess()
        spawned.on('error', vi.fn())
        const spy = vi.fn()
        spawned.on('close', spy)
        spawned.close(1, null)
        expect(spy).toHaveBeenCalledTimes(1)
    })

    it('passes custom env variables to spawned process', () => {
        createProcess({ env: { MY_VAR: 'hello' } })
        const options = spawn.mock.calls[spawn.mock.calls.length - 1][2]
        expect(options.env).toEqual(expect.objectContaining({
            MY_VAR: 'hello',
            NODE_ENV: 'test',
        }))
    })

    it('uses SSH binary when ssh option is true', () => {
        createProcess({
            ssh: true,
            sshOptions: {
                host: 'example.com',
                user: 'deploy',
            },
        })
        expect(spawn).toHaveBeenLastCalledWith(
            'ssh',
            expect.any(Array),
            expect.objectContaining({ shell: true }),
        )
    })

    it('splits command into binary and arguments', () => {
        createProcess({ command: 'npx jest --coverage', platform: 'darwin' })
        expect(spawn).toHaveBeenLastCalledWith(
            expect.any(String),
            ['-lc', 'npx jest --coverage'],
            expect.any(Object),
        )
    })

    it('merges command args with process options args', () => {
        createProcess({ command: 'npx jest', args: ['--verbose'], platform: 'darwin' })
        expect(spawn).toHaveBeenLastCalledWith(
            expect.any(String),
            ['-lc', 'npx jest --verbose'],
            expect.any(Object),
        )
    })

    it('skips login shell wrapping on Windows', () => {
        createProcess({ command: 'npx jest --coverage', platform: 'win32' })
        expect(spawn).toHaveBeenLastCalledWith(
            'npx',
            ['jest', '--coverage'],
            expect.any(Object),
        )
    })
})
