import * as Path from 'path'
import * as fs from 'fs-extra'
import { DefaultProcess } from '@lib/process/process'

const fixtures = Path.join(__dirname, '../../../fixtures/process')
const decoded = fs.readJsonSync(Path.join(__dirname, '../../../fixtures/process/decoded.json'))

describe('main/lib/process/DefaultProcess', () => {
    it('emits decoded reports', () => {
        const spy = jest.fn()
        const spawned = new DefaultProcess(Path.join(fixtures, '1.json'))
            .on('report', spy)
        process.nextTick(() => {
            expect(spy.mock.calls.length).toBe(1)
            expect(spy.mock.calls[0][0].report).toEqual(decoded)
            expect(spawned.reportClosed).toBe(true)
        })
    })
    it('can parse chunks with start delimiter', () => {
        const spy = jest.fn()
        new DefaultProcess(Path.join(fixtures, '2.json'))
            .on('report', spy)
        process.nextTick(() => {
            expect(spy.mock.calls.length).toBe(1)
            expect(spy.mock.calls[0][0].report).toEqual(decoded)
        })
    })
    it('can parse chunks with end delimiter', () => {
        const spy = jest.fn()
        new DefaultProcess(Path.join(fixtures, '3.json'))
            .on('report', spy)
        process.nextTick(() => {
            expect(spy.mock.calls.length).toBe(1)
            expect(spy.mock.calls[0][0].report).toEqual(decoded)
        })
    })
    it('can parse chunks with both delimiters', () => {
        const spy = jest.fn()
        new DefaultProcess(Path.join(fixtures, '4.json'))
            .on('report', spy)
        process.nextTick(() => {
            expect(spy.mock.calls.length).toBe(1)
            expect(spy.mock.calls[0][0].report).toEqual(decoded)
        })
    })
    it('can buffer chunks', () => {
        const spy = jest.fn()
        new DefaultProcess(Path.join(fixtures, '5.json'))
            .on('report', spy)
        process.nextTick(() => {
            expect(spy.mock.calls.length).toBe(1)
            expect(spy.mock.calls[0][0].report).toEqual(decoded)
        })
    })
    it('can buffer chunks with start delimiter', () => {
        const spy = jest.fn()
        new DefaultProcess(Path.join(fixtures, '6.json'))
            .on('report', spy)
        process.nextTick(() => {
            expect(spy.mock.calls.length).toBe(1)
            expect(spy.mock.calls[0][0].report).toEqual(decoded)
        })
    })
    it('can buffer chunks with end delimiter', () => {
        const spy = jest.fn()
        new DefaultProcess(Path.join(fixtures, '7.json'))
            .on('report', spy)
        process.nextTick(() => {
            expect(spy.mock.calls.length).toBe(1)
            expect(spy.mock.calls[0][0].report).toEqual(decoded)
        })
    })
    it('can buffer chunks with both delimiters', () => {
        const spy = jest.fn()
        new DefaultProcess(Path.join(fixtures, '8.json'))
            .on('report', spy)
        process.nextTick(() => {
            expect(spy.mock.calls.length).toBe(1)
            expect(spy.mock.calls[0][0].report).toEqual(decoded)
        })
    })
    it('can parse reports without whitespace in chunk', () => {
        const spy = jest.fn()
        new DefaultProcess(Path.join(fixtures, '9.json'))
            .on('report', spy)
        process.nextTick(() => {
            expect(spy.mock.calls.length).toBe(1)
            expect(spy.mock.calls[0][0].report).toEqual(decoded)
        })
    })
    it('can parse multiple reports in the same chunk', () => {
        const spy = jest.fn()
        new DefaultProcess(Path.join(fixtures, '10.json'))
            .on('report', spy)
        process.nextTick(() => {
            expect(spy).toHaveBeenCalledTimes(2)
            expect(spy.mock.calls[0][0].report).toEqual(decoded)
            expect(spy.mock.calls[1][0].report).toEqual(decoded)
        })
    })
    it('can parse multiple reports in the same chunk with start delimiter', () => {
        const spy = jest.fn()
        new DefaultProcess(Path.join(fixtures, '11.json'))
            .on('report', spy)
        process.nextTick(() => {
            expect(spy).toHaveBeenCalledTimes(2)
            expect(spy.mock.calls[0][0].report).toEqual(decoded)
            expect(spy.mock.calls[1][0].report).toEqual(decoded)
        })
    })
    it('can parse multiple reports in the same chunk with end delimiter', () => {
        const spy = jest.fn()
        new DefaultProcess(Path.join(fixtures, '12.json'))
            .on('report', spy)
        process.nextTick(() => {
            expect(spy).toHaveBeenCalledTimes(2)
            expect(spy.mock.calls[0][0].report).toEqual(decoded)
            expect(spy.mock.calls[1][0].report).toEqual(decoded)
        })
    })
    it('can parse multiple reports in the same chunk with both delimiters', () => {
        const spy = jest.fn()
        new DefaultProcess(Path.join(fixtures, '13.json'))
            .on('report', spy)
        process.nextTick(() => {
            expect(spy).toHaveBeenCalledTimes(2)
            expect(spy.mock.calls[0][0].report).toEqual(decoded)
            expect(spy.mock.calls[1][0].report).toEqual(decoded)
        })
    })
    it('can parse multiple reports in the same chunk with stray whitespace', () => {
        const spy = jest.fn()
        new DefaultProcess(Path.join(fixtures, '14.json'))
            .on('report', spy)
        process.nextTick(() => {
            expect(spy).toHaveBeenCalledTimes(2)
            expect(spy.mock.calls[0][0].report).toEqual(decoded)
            expect(spy.mock.calls[1][0].report).toEqual(decoded)
        })
    })
    it('can parse multiple buffered reports', () => {
        const spy = jest.fn()
        new DefaultProcess(Path.join(fixtures, '15.json'))
            .on('report', spy)
        process.nextTick(() => {
            expect(spy).toHaveBeenCalledTimes(2)
            expect(spy.mock.calls[0][0].report).toEqual(decoded)
            expect(spy.mock.calls[1][0].report).toEqual(decoded)
        })
    })
    it('can buffer reports with chunked start wrapper', () => {
        const spy = jest.fn()
        new DefaultProcess(Path.join(fixtures, '16.json'))
            .on('report', spy)
        process.nextTick(() => {
            expect(spy.mock.calls.length).toBe(1)
            expect(spy.mock.calls[0][0].report).toEqual(decoded)
        })
    })
    it('can buffer reports with chunked end wrapper', () => {
        const spy = jest.fn()
        new DefaultProcess(Path.join(fixtures, '17.json'))
            .on('report', spy)
        process.nextTick(() => {
            expect(spy.mock.calls.length).toBe(1)
            expect(spy.mock.calls[0][0].report).toEqual(decoded)
        })
    })
    it('can buffer reports with chunked wrappers and padding', () => {
        const spy = jest.fn()
        new DefaultProcess(Path.join(fixtures, '18.json'))
            .on('report', spy)
        process.nextTick(() => {
            expect(spy.mock.calls.length).toBe(1)
            expect(spy.mock.calls[0][0].report).toEqual(decoded)
        })
    })
    it('can stores only stray content, not reports', () => {
        const spy = jest.fn()
        const spawned = new DefaultProcess(Path.join(fixtures, '19.json'))
            .on('report', spy)
        process.nextTick(() => {
            expect(spy.mock.calls.length).toBe(1)
            expect(spy.mock.calls[0][0].report).toEqual(decoded)
            expect(spawned.rawChunks).toEqual([
                'Starting...',
                'Ended!'
            ])
        })
    })
    it('handles interrupted report streams', () => {
        const spy = jest.fn()
        const spawned = new DefaultProcess(Path.join(fixtures, '20.json'))
            .on('report', spy)
        process.nextTick(() => {
            expect(spy.mock.calls.length).toBe(1)
            expect(spy.mock.calls[0][0].report).toEqual(decoded)
            expect(spawned.rawChunks).toEqual([
                'Starting...',
                'Ended!'
            ])
            expect(spawned.reportClosed).toBe(false)

            // Force the process to close again, this time with an error exit
            // code, to ensure error message is well built.
            expect(() => {
                spawned.close(-1)
            }).toThrow()
            expect(spawned.error).toBe('Starting...Ended!')
        })
    })
    it('handles interrupted report streams, with final output in same chunk as report', () => {
        const spy = jest.fn()
        const spawned = new DefaultProcess(Path.join(fixtures, '21.json'))
            .on('report', spy)
        process.nextTick(() => {
            expect(spy.mock.calls.length).toBe(1)
            expect(spy.mock.calls[0][0].report).toEqual(decoded)
            // Raw chunk store will not contain the ending message, as it is
            // mixed with the report chunk itself, but we *should* still be
            // capable of outputting it in the error message.
            expect(spawned.rawChunks).toEqual([
                'Starting...'
            ])
            expect(spawned.reportClosed).toBe(false)

            expect(() => {
                spawned.close(-1)
            }).toThrow()

            // Even though it isn't in the raw chunk store, final message must
            // show in the error property after process closes with non-zero code.
            expect(spawned.error).toBe('Starting...Ended!')
        })
    })
    it('can get the lines from a closed process', () => {
        const spawned = new DefaultProcess(Path.join(fixtures, '22.json'))
        process.nextTick(() => {
            expect(spawned.getLines()).toEqual([
                'Starting...',
                'Ended!'
            ])
            expect(spawned.getRawLines()).toEqual([
                '\u001b[1mStarting...\u001b[0m',
                '\u001b[1mEnded!\u001b[0m'
            ])
        })
    })
})
