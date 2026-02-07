import * as Path from 'path'
import * as fs from 'fs-extra'
import { DefaultProcess } from '@lib/process/process'
import { spawn } from 'child_process'

vi.mock('child_process', () => ({
    spawn: vi.fn().mockReturnValue({
        on: vi.fn(),
        stdout: {
            setEncoding: vi.fn(),
            on: vi.fn()
        },
        stderr: {
            setEncoding: vi.fn(),
            on: vi.fn()
        }
    })
}))

const fixtures = Path.join(__dirname, '../../fixtures/process')
const decoded = fs.readJsonSync(Path.join(__dirname, '../../fixtures/process/decoded.json'))

it('spawns processes', () => {
    const spawned = new DefaultProcess({
        path: 'pantry',
        command: 'biscuit --hobnobs --digestives rich=tea',
        ssh: false
    })
    expect(spawn).toHaveBeenCalledTimes(1)
    expect(spawn).toHaveBeenCalledWith(
        'biscuit',
        ['--hobnobs', '--digestives', 'rich=tea'],
        // Ignore last argument, we'll assert relevant bits individually.
        expect.any(Object)
    )

    const options = spawn.mock.calls[0][2]
    expect(options.cwd).toBe('pantry')
    expect(options.detached).toBe(false)
    expect(options.shell).toBe(false)
    expect(options.windowsHide).toBe(true)
    expect(options.env).toEqual(expect.objectContaining({
        NODE_ENV: 'test', // Default for spawned test processes.
        FORCE_COLOR: 3    // Adds process overrides.
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
        'Ended!'
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
        'Ended!'
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
        '\n<<<REPORT{\n'
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
        'Ended!'
    ])
    expect(spawned.getRawLines()).toEqual([
        '\u001b[1mStarting...\u001b[0m',
        '\u001b[1mEnded!\u001b[0m'
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
        '}REPORT>>>'
    ])
})
