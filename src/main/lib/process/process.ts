import stripAnsi from 'strip-ansi'
import { EventEmitter } from 'events'
import * as Path from 'path'
import * as fs from 'fs-extra'
import { compact, flattenDeep } from 'lodash'
import { spawn, ChildProcess } from 'child_process'
import { Logger } from '../logger'
import { ErrorWithCode } from './errors'

export interface IProcess extends EventEmitter {
    readonly process?: ChildProcess
    getId (): number
    stop (): void
    owns (command: string): boolean
}

export class DefaultProcess extends EventEmitter implements IProcess {
    command: string
    spawnPath: string = ''
    args: Array<string> = []
    path?: string
    rawChunks: Array<string>
    error: string
    killed: boolean
    reports: boolean
    reportBuffer: string
    reportClosed: boolean
    writeToFile: boolean = false
    fromFile?: string
    process?: ChildProcess

    constructor (
       command: string,
       args: Array<string> = [],
       path?: string
    ) {
        super()

        // Remember raw command and path for user feedback
        this.command = command
        this.path = path

        // Set process control defaults
        this.rawChunks = []
        this.error = ''
        this.killed = false
        this.reports = false
        this.reportBuffer = ''
        this.reportClosed = false

        if (Path.isAbsolute(command)) {
            this.fromFile = command
        }

        // We can re-process stored streams with the `fromFile` property,
        // being that of a JSON file stored in the debug folder (i.e. previously
        // recorded using the `writeToFile` property).
        if (this.fromFile) {
            process.nextTick(() => {
                const file = Path.isAbsolute(this.fromFile!) ? this.fromFile! : Path.join(__dirname, `./debug/${this.fromFile}.json`)
                Logger.debug.log(`Re-running process from file ${file}.`)
                if (!fs.existsSync(file)) {
                    Logger.debug.log(`File ${file} does not exist.`)
                }
                const stored = fs.readJsonSync(file, { throws: false }) || []
                stored.forEach((chunk: string) => {
                    this.onData(chunk)
                })
                this.onClose(0, null)
            }, 0)
            return
        }

        // Parse command and arguments into something we
        // can use for spawning a process.
        this.args = compact(
            flattenDeep([command].concat(args!).map((arg: string) => {
                return arg.split(' ')
            }))
        )
        this.spawnPath = this.args.shift()!

        Logger.debug.log('Spawning command', { spawn: this.spawnPath, args: this.args, path: this.path })
        Logger.debug.log(`Command: ${this.spawnPath} ${this.args.join(' ')}`)

        const spawnedProcess = spawn(this.spawnPath, this.args || [], {
            cwd: this.path,
            detached: true,
            env: Object.assign({}, process.env, {
                // Ensure ANSI color is supported
                FORCE_COLOR: 1
            })
        })

        Logger.info.group(`Process ${spawnedProcess.pid}`)

        spawnedProcess.stdout.setEncoding('utf8')
        spawnedProcess.stderr.setEncoding('utf8')
        this.addListeners(spawnedProcess)

        this.process = spawnedProcess
    }

    /**
     * Add class listeners to a newly spawned child process.
     *
     * @param process The child process to add listeners to.
     */
    private addListeners (process: ChildProcess) {
        process.on('close', (...args) => this.onClose(...args))
        process.on('error', (err) => this.onError(err as ErrorWithCode))
        process.stdout.on('data', (...args) => this.onData(...args))
        process.stderr.on('data', (...args) => this.onData(...args))
    }

    /**
     * Get this process's unique id.
     */
    public getId (): number {
        return this.fromFile ? parseInt(Path.basename(this.fromFile)) : this.process!.pid
    }

    /**
     * Handle an error during processing.
     *
     * @param err The error we're attempting to handle.
     */
    private onError (err: ErrorWithCode): void {

        Logger.debug.log('Process error', err)

        // If the error's code is a string then it means the code isn't the
        // process's exit code but rather an error coming from Node's bowels,
        // e.g., ENOENT.
        if (typeof err.code === 'string') {
            if (err.code === 'ENOENT') {
                this.error = `${this.command}: command not found`
            }
            return
        }

        this.error = err.message
    }

    /**
     * Handle the closing of the process.
     *
     * @param code The exit code that triggered the process closing.
     * @param signal The signal string that triggered the process closing.
     */
    private onClose(code: number, signal: string | null) {

        Logger.debug.log('Process closing.', { code, signal })

        // If exit code was non-zero but we were running a report
        // that finished successfully, we should ignore the error,
        // assuming it relates to a failure in the tests for which
        // we'll give appropriate feedback on in the interface.
        if (code === 0 || (this.reports && this.reportClosed)) {
            Logger.debug.log('Process successfully exited.')
            this.emit('success', { process: this })
        } else if (this.process && this.process.killed || this.killed) {
            Logger.debug.log('Process killed.')
            this.emit('killed', { process: this })
        } else {
            Logger.debug.log('Process errored.', this)

            // If process errored out but did not emit an error event, we'll
            // compose it from the chunks we received. If error occurred while
            // we were building a report buffer, output that, too, as it could
            // contain a partial report, but it could also contain crucial
            // information about the error itself.
            if (!this.error) {
                if (this.reportBuffer) {
                    this.rawChunks.push(this.reportBuffer)
                }
                this.error = this.rawChunks.join('')
            }

            Logger.debug.log('Process errored without throwing.', { error: this.error })

            this.emit('error', {
                process: this,
                message: this.error,
                code
            })
        }

        Logger.info.groupEnd()

        this.emit('close', { process: this })
    }

    /**
     * Handle output data from the process.
     *
     * @param rawChunk The chunk of data we're about to process.
     */
    private onData(rawChunk: string): void {

        // When debugging a stream, we can write all chunks
        // to a file then repeat them as needed.
        if (!this.fromFile && this.writeToFile) {
            const file = Path.join(__dirname, `./debug/${this.process!.pid}.json`)
            if (!fs.existsSync(file)) {
                fs.writeFileSync(file, JSON.stringify([], null, 4))
            }
            const stored = fs.readJsonSync(file, { throws: false }) || []
            stored.push(rawChunk)
            fs.writeFileSync(file, JSON.stringify(stored, null, 4))
        }

        this.emit('data', {
            process: this,
            chunk: rawChunk
        })

        let storeChunk: boolean = true
        const lines: Array<string> = rawChunk.split('\n')

        if (lines.length) {

            // Look for report prefix in the first line
            // of this chunk. If found, start report mode.
            if (!this.reports && !this.reportClosed) {
                if (lines.includes('{')) {
                    this.reports = true

                    // Remove delimiter from raw chunk, in case need to we store it.
                    rawChunk = rawChunk.replace(/\n\{\n?/m, '')
                }
            }

            if (this.reports && !this.reportClosed) {
                // Only add to buffer if it's full or partial base64 string,
                // as some reporters might occasionally output stray content.
                if ((/^[A-Za-z0-9\/\+=\(\)]+$/im).test(rawChunk)) {
                    this.reportBuffer += rawChunk
                    // Test if buffer is now a complete report and, if so, extract it
                    if ((/\((?:(?!\)).)+\)/).test(this.reportBuffer)) {
                        this.reportBuffer = this.reportBuffer.replace(/\s?({\s?)?\((?:(?!\)).)+\)\s?}?/g, (match, offset, string) => {
                            this.report(match)
                            return ''
                        })
                    }
                    storeChunk = false
                }

                if (lines.includes('}')) {
                    this.reportClosed = true

                    // Remove delimiter from raw chunk, in case need to we store it.
                    rawChunk = rawChunk.replace(/\n?\}/m, '')
                }
            }
        }

        // If reporting hasn't overridden store directive and if there's still
        // chunk left to store, add it to our output array.
        if (storeChunk && rawChunk) {
            this.rawChunks.push(rawChunk)
            Logger.info.log(rawChunk)
        }
    }

    /**
     * Emit a test report that was extracted from the output stream.
     *
     * @param encoded The base64 encoded string that the process identified as a report.
     */
    private report (encoded: string): void {
        const report: object | string = this.parseReport(encoded)
        this.emit('report', {
            process: this,
            report
        })
        Logger.info.log('[encoded]')
        Logger.debug.dir(report)
    }

    /**
     * Parse an encoded report extracted from the output stream.
     *
     * @param chunk The data chunk to parse as a report.
     */
    private parseReport (chunk: string): object | string {
        chunk = Buffer.from(chunk.match(/\((.+)\)/)![1], 'base64').toString('utf8')
        try {
            return JSON.parse(chunk)
        } catch (SyntaxError) {
            Logger.info.log('Failed to decode report.')
            return chunk
        }
    }

    /**
     * Get all lines received from the output stream, clear of Ansi escape codes.
     */
    public getLines (): Array<string> {
        return this.rawChunks.join('\n').split('\n').map(chunk => stripAnsi(chunk))
    }

    /**
     * Get all lines received from the output stream, unprocessed
     */
    public getRawLines (): Array<string> {
        return this.rawChunks.join('\n').split('\n')
    }

    /**
     * Kill this process.
     */
    public stop (): void {
        this.killed = true
        process.kill(-this.process!.pid);
    }

    /**
     * Force closing of the process. For testing purposes only.
     *
     * @param code The exit code with which to close the process.
     * @param signal The signal string with which to close the process.
     */
    public close (code: number, signal: string | null): void {
        this.onClose(code, signal)
    }

    /**
     * Whether this process owns a given command. Specific process runners (e.g
     * Yarn, NPM, etc) should override this method.
     *
     * @param command The command that could match a given runner.
     */
    owns (command: string): boolean {
        return true
    }
}
