import * as Path from 'path'
import * as fs from 'fs-extra'
import { DefaultProcess } from '@lib/process/process'

const fixtures = Path.join(__dirname, '../../fixtures/process')
const decoded = fs.readJsonSync(Path.join(__dirname, '../../fixtures/process/decoded.json'))

beforeAll(() => {
    // Capture calls to the global logger and suppress console logs.
    global.log = {
        debug () {},
        info () {},
        warn () {},
        error () {}
    }
    global.console = { log () {} }
})

describe('main/lib/process/DefaultProcess', () => {
    it('emits decoded reports', (done) => {
        process.env.FROM_FILE = Path.join(fixtures, '1.json')
        const spy = jest.fn()
        const spawned = new DefaultProcess()
            .on('report', spy)
        process.nextTick(() => {
            expect(spy.mock.calls.length).toBe(1)
            expect(spy.mock.calls[0][0].report).toEqual(decoded)
            expect(spawned.reportClosed).toBe(true)
            done()
        })
    })

    it('can parse chunks with start delimiter', (done) => {
        process.env.FROM_FILE = Path.join(fixtures, '2.json')
        const spy = jest.fn()
        new DefaultProcess()
            .on('report', spy)
        process.nextTick(() => {
            expect(spy.mock.calls.length).toBe(1)
            expect(spy.mock.calls[0][0].report).toEqual(decoded)
            done()
        })
    })

    it('can parse chunks with end delimiter', (done) => {
        process.env.FROM_FILE = Path.join(fixtures, '3.json')
        const spy = jest.fn()
        new DefaultProcess()
            .on('report', spy)
        process.nextTick(() => {
            expect(spy.mock.calls.length).toBe(1)
            expect(spy.mock.calls[0][0].report).toEqual(decoded)
            done()
        })
    })

    it('can parse chunks with both delimiters', (done) => {
        process.env.FROM_FILE = Path.join(fixtures, '4.json')
        const spy = jest.fn()
        new DefaultProcess()
            .on('report', spy)
        process.nextTick(() => {
            expect(spy.mock.calls.length).toBe(1)
            expect(spy.mock.calls[0][0].report).toEqual(decoded)
            done()
        })
    })

    it('can buffer chunks', (done) => {
        process.env.FROM_FILE = Path.join(fixtures, '5.json')
        const spy = jest.fn()
        new DefaultProcess()
            .on('report', spy)
        process.nextTick(() => {
            expect(spy.mock.calls.length).toBe(1)
            expect(spy.mock.calls[0][0].report).toEqual(decoded)
            done()
        })
    })

    it('can buffer chunks with start delimiter', (done) => {
        process.env.FROM_FILE = Path.join(fixtures, '6.json')
        const spy = jest.fn()
        new DefaultProcess()
            .on('report', spy)
        process.nextTick(() => {
            expect(spy.mock.calls.length).toBe(1)
            expect(spy.mock.calls[0][0].report).toEqual(decoded)
            done()
        })
    })

    it('can buffer chunks with end delimiter', (done) => {
        process.env.FROM_FILE = Path.join(fixtures, '7.json')
        const spy = jest.fn()
        new DefaultProcess()
            .on('report', spy)
        process.nextTick(() => {
            expect(spy.mock.calls.length).toBe(1)
            expect(spy.mock.calls[0][0].report).toEqual(decoded)
            done()
        })
    })

    it('can buffer chunks with both delimiters', (done) => {
        process.env.FROM_FILE = Path.join(fixtures, '8.json')
        const spy = jest.fn()
        new DefaultProcess()
            .on('report', spy)
        process.nextTick(() => {
            expect(spy.mock.calls.length).toBe(1)
            expect(spy.mock.calls[0][0].report).toEqual(decoded)
            done()
        })
    })

    it('can parse reports without whitespace in chunk', (done) => {
        process.env.FROM_FILE = Path.join(fixtures, '9.json')
        const spy = jest.fn()
        new DefaultProcess()
            .on('report', spy)
        process.nextTick(() => {
            expect(spy.mock.calls.length).toBe(1)
            expect(spy.mock.calls[0][0].report).toEqual(decoded)
            done()
        })
    })

    it('can parse multiple reports in the same chunk', (done) => {
        process.env.FROM_FILE = Path.join(fixtures, '10.json')
        const spy = jest.fn()
        new DefaultProcess()
            .on('report', spy)
        process.nextTick(() => {
            expect(spy).toHaveBeenCalledTimes(2)
            expect(spy.mock.calls[0][0].report).toEqual(decoded)
            expect(spy.mock.calls[1][0].report).toEqual(decoded)
            done()
        })
    })

    it('can parse multiple reports in the same chunk with start delimiter', (done) => {
        process.env.FROM_FILE = Path.join(fixtures, '11.json')
        const spy = jest.fn()
        new DefaultProcess()
            .on('report', spy)
        process.nextTick(() => {
            expect(spy).toHaveBeenCalledTimes(2)
            expect(spy.mock.calls[0][0].report).toEqual(decoded)
            expect(spy.mock.calls[1][0].report).toEqual(decoded)
            done()
        })
    })

    it('can parse multiple reports in the same chunk with end delimiter', (done) => {
        process.env.FROM_FILE = Path.join(fixtures, '12.json')
        const spy = jest.fn()
        new DefaultProcess()
            .on('report', spy)
        process.nextTick(() => {
            expect(spy).toHaveBeenCalledTimes(2)
            expect(spy.mock.calls[0][0].report).toEqual(decoded)
            expect(spy.mock.calls[1][0].report).toEqual(decoded)
            done()
        })
    })

    it('can parse multiple reports in the same chunk with both delimiters', (done) => {
        process.env.FROM_FILE = Path.join(fixtures, '13.json')
        const spy = jest.fn()
        new DefaultProcess()
            .on('report', spy)
        process.nextTick(() => {
            expect(spy).toHaveBeenCalledTimes(2)
            expect(spy.mock.calls[0][0].report).toEqual(decoded)
            expect(spy.mock.calls[1][0].report).toEqual(decoded)
            done()
        })
    })

    it('can parse multiple reports in the same chunk with stray whitespace', (done) => {
        process.env.FROM_FILE = Path.join(fixtures, '14.json')
        const spy = jest.fn()
        new DefaultProcess()
            .on('report', spy)
        process.nextTick(() => {
            expect(spy).toHaveBeenCalledTimes(2)
            expect(spy.mock.calls[0][0].report).toEqual(decoded)
            expect(spy.mock.calls[1][0].report).toEqual(decoded)
            done()
        })
    })

    it('can parse multiple buffered reports', (done) => {
        process.env.FROM_FILE = Path.join(fixtures, '15.json')
        const spy = jest.fn()
        new DefaultProcess()
            .on('report', spy)
        process.nextTick(() => {
            expect(spy).toHaveBeenCalledTimes(2)
            expect(spy.mock.calls[0][0].report).toEqual(decoded)
            expect(spy.mock.calls[1][0].report).toEqual(decoded)
            done()
        })
    })

    it('can buffer reports with chunked start wrapper', (done) => {
        process.env.FROM_FILE = Path.join(fixtures, '16.json')
        const spy = jest.fn()
        new DefaultProcess()
            .on('report', spy)
        process.nextTick(() => {
            expect(spy.mock.calls.length).toBe(1)
            expect(spy.mock.calls[0][0].report).toEqual(decoded)
            done()
        })
    })

    it('can buffer reports with chunked end wrapper', (done) => {
        process.env.FROM_FILE = Path.join(fixtures, '17.json')
        const spy = jest.fn()
        new DefaultProcess()
            .on('report', spy)
        process.nextTick(() => {
            expect(spy.mock.calls.length).toBe(1)
            expect(spy.mock.calls[0][0].report).toEqual(decoded)
            done()
        })
    })

    it('can buffer reports with chunked wrappers and padding', (done) => {
        process.env.FROM_FILE = Path.join(fixtures, '18.json')
        const spy = jest.fn()
        new DefaultProcess()
            .on('report', spy)
        process.nextTick(() => {
            expect(spy.mock.calls.length).toBe(1)
            expect(spy.mock.calls[0][0].report).toEqual(decoded)
            done()
        })
    })

    it('stores only stray content, not report content', (done) => {
        process.env.FROM_FILE = Path.join(fixtures, '19.json')
        const spy = jest.fn()
        const spawned = new DefaultProcess()
            .on('report', spy)
        process.nextTick(() => {
            expect(spy.mock.calls.length).toBe(1)
            expect(spy.mock.calls[0][0].report).toEqual(decoded)
            expect(spawned.chunks).toEqual([
                'Starting...',
                '\n<<<REPORT{\n',
                '\n}REPORT>>>',
                'Ended!'
            ])
            done()
        })
    })

    it('handles interrupted report streams', (done) => {
        process.env.FROM_FILE = Path.join(fixtures, '20.json')
        const spy = jest.fn()
        const spawned = new DefaultProcess()
            .on('report', spy)
        process.nextTick(() => {
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
            done()
        })
    })

    it('handles interrupted report streams, with final output in same chunk as report', (done) => {
        process.env.FROM_FILE = Path.join(fixtures, '21.json')
        const spy = jest.fn()
        const spawned = new DefaultProcess()
            .on('report', spy)
        process.nextTick(() => {
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
            done()
        })
    })

    it('can get the lines from a closed process', (done) => {
        process.env.FROM_FILE = Path.join(fixtures, '22.json')
        const spawned = new DefaultProcess()
        process.nextTick(() => {
            expect(spawned.getLines()).toEqual([
                'Starting...',
                'Ended!'
            ])
            expect(spawned.getRawLines()).toEqual([
                '\u001b[1mStarting...\u001b[0m',
                '\u001b[1mEnded!\u001b[0m'
            ])
            done()
        })
    })

    it('can parse lines with carriage returns', (done) => {
        process.env.FROM_FILE = Path.join(fixtures, '23.json')
        const spy = jest.fn()
        const spawned = new DefaultProcess()
            .on('report', spy)
        process.nextTick(() => {
            expect(spy.mock.calls.length).toBe(1)
            expect(spy.mock.calls[0][0].report).toEqual(decoded)
            expect(spawned.reportClosed).toBe(true)
            done()
        })
    })

    it('does not confuse object notations with delimiters', (done) => {
        process.env.FROM_FILE = Path.join(fixtures, '24.json')
        const spy = jest.fn()
        const spawned = new DefaultProcess()
            .on('report', spy)
        process.nextTick(() => {
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
            done()
        })
    })

    it('can detect start delimiters accross multiple lines regardless of whitespace', (done) => {
        process.env.FROM_FILE = Path.join(fixtures, '25.json')
        const spy = jest.fn()
        const spawned = new DefaultProcess()
            .on('report', spy)
        process.nextTick(() => {
            expect(spy.mock.calls.length).toBe(1)
            expect(spy.mock.calls[0][0].report).toEqual(decoded)
            expect(spawned.reportClosed).toBe(true)
            done()
        })
    })

    it('can detect end delimiters accross multiple lines regardless of whitespace', (done) => {
        process.env.FROM_FILE = Path.join(fixtures, '26.json')
        const spy = jest.fn()
        const spawned = new DefaultProcess()
            .on('report', spy)
        process.nextTick(() => {
            expect(spy.mock.calls.length).toBe(1)
            expect(spy.mock.calls[0][0].report).toEqual(decoded)
            expect(spawned.reportClosed).toBe(true)
            done()
        })
    })

    it('can detect start delimiters within gibberish strings', (done) => {
        process.env.FROM_FILE = Path.join(fixtures, '27.json')
        const spy = jest.fn()
        const spawned = new DefaultProcess()
            .on('report', spy)
        process.nextTick(() => {
            expect(spy.mock.calls.length).toBe(1)
            expect(spy.mock.calls[0][0].report).toEqual(decoded)
            expect(spawned.reportClosed).toBe(true)
            done()
        })
    })

    it('can detect end delimiters within gibberish strings', (done) => {
        process.env.FROM_FILE = Path.join(fixtures, '28.json')
        const spy = jest.fn()
        const spawned = new DefaultProcess()
            .on('report', spy)
        process.nextTick(() => {
            expect(spy.mock.calls.length).toBe(1)
            expect(spy.mock.calls[0][0].report).toEqual(decoded)
            expect(spawned.reportClosed).toBe(true)
            done()
        })
    })

    it('can buffer strings with parenthesis and exclude them from reports', (done) => {
        process.env.FROM_FILE = Path.join(fixtures, '29.json')
        const spy = jest.fn()
        const spawned = new DefaultProcess()
            .on('report', spy)
        process.nextTick(() => {
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
            done()
        })
    })
})
