import stripAnsi from 'strip-ansi'
import { EventEmitter } from 'events'
import * as Path from 'path'
import * as Fs from 'fs-extra'
import { compact, flattenDeep, get } from 'lodash'
import { spawn, ChildProcess } from 'child_process'
import { Logger } from '../logger'
import { SSHOptions, SSH } from './ssh'
import { ErrorWithCode, ProcessError } from './errors'

export type ProcessOptions = {
    command: string
    args: Array<string>
    path: string
    forceRunner?: string | null
    ssh?: boolean
    sshOptions?: SSHOptions
}

export interface IProcess extends EventEmitter {
    readonly process?: ChildProcess
    getId (): number
    stop (): void
    owns (command: string): boolean
}

export class DefaultProcess extends EventEmitter implements IProcess {
    static readonly type: string = 'default'
    command!: string
    binary: string = ''
    args: Array<string> = []
    path?: string
    chunks: Array<string> = []
    rawChunks: Array<string> = []
    error: string = ''
    killed: boolean = false
    closed: boolean = false
    exitCode?: number
    exitSignal: string | null = null
    reports: boolean = false
    reportBuffer: string = ''
    reportClosed: boolean = false
    writeToFile: boolean = false
    process?: ChildProcess

    constructor (options: ProcessOptions) {
        super()

        // We can re-process stored streams by running FROM_FILE=${file} yarn dev.
        // If set, all processes will output chunks from the stored file.
        if (__DEV__ && process.env.FROM_FILE) {
            process.nextTick(() => {
                const file = Path.isAbsolute(process.env.FROM_FILE!)
                    ? process.env.FROM_FILE!
                    : Path.join(__dirname, `./debug/${process.env.FROM_FILE}.json`)

                Logger.debug.log(`Re-running process from file ${file}.`)

                if (!Fs.existsSync(file)) {
                    Logger.debug.log(`File ${file} does not exist.`)
                }

                const stored = Fs.readJsonSync(file, { throws: false }) || []
                get(stored, 'process.rawChunks', []).forEach((chunk: string) => {
                    this.onData(chunk)
                })
                this.onClose(get(stored, 'process.exitCode', 0), null)
            }, 0)
            return
        }

        // Remember raw command and path for user feedback
        this.command = options.command
        this.path = options.path

        // Parse command and arguments into something we
        // can use for spawning a process.
        this.args = this.spawnArguments(
            compact(
                flattenDeep(([this.command] as any).concat(options.args!).map((arg: string) => {
                    return arg.split(' ')
                }))
            ) || []
        )

        if (options.ssh) {
            this.binary = 'ssh'
            this.args = (new SSH(options.sshOptions)).commandArgs(this.args)
        } else {
            this.binary = this.args.shift()!
        }

        Logger.debug.log('Spawning command', { spawn: this.binary, args: this.args, path: this.path })
        Logger.debug.log(`Command: ${this.binary} ${this.args.join(' ')}`)

        const spawnedProcess = spawn(this.binary, this.args, {
            cwd: this.path,
            detached: true,
            shell: options.ssh,
            env: Object.assign({}, process.env, {
                // Ensure ANSI color is supported
                FORCE_COLOR: 1
            })
        })

        spawnedProcess.stdout.setEncoding('utf8')
        spawnedProcess.stderr.setEncoding('utf8')
        this.addListeners(spawnedProcess)

        this.process = spawnedProcess
    }

    /**
     * Return the array of arguments with which to spawn the child process.
     * This is a chance for runners to influence how arguments are passed.
     */
    protected spawnArguments (args: Array<string>): Array<string> {
        return args
    }

    /**
     * Add class listeners to a newly spawned child process.
     *
     * @param process The child process to add listeners to.
     */
    protected addListeners (process: ChildProcess) {
        process.on('close', (...args) => this.onClose(...args))
        process.on('error', (err) => this.onError(err as ErrorWithCode))
        process.stdout.on('data', (...args) => this.onData(...args))
        process.stderr.on('data', (...args) => this.onData(...args))
    }

    /**
     * Get this process's unique id.
     */
    public getId (): number {
        if (__DEV__ && process.env.FROM_FILE) {
            // If we're re-processing from a file, generate a hash from the filename.
            return Array.from(process.env.FROM_FILE).reduce((s, c) => Math.imul(31, s) + c.charCodeAt(0) | 0, 0)
        }
        return this.process!.pid
    }

    /**
     * Handle an error during processing.
     *
     * @param err The error we're attempting to handle.
     */
    protected onError (err: ErrorWithCode): void {

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
    protected onClose(code: number, signal: string | null) {

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
                    this.chunks.push(this.reportBuffer)
                }
                this.error = this.chunks.join('')
            }

            const error = (new ProcessError(this.error))
                .setProcess(this)
                .setCode(code)

            Logger.debug.log('Process errored without throwing.', { error })

            this.emit('error', error)
        }

        if (this.writeToFile) {
            Logger.debug
                .withError(this.error)
                .withProcess(this)
                .save(Path.join(__dirname, 'debug'))
        }

        this.closed = true
        this.exitCode = code
        this.exitSignal = signal
        this.emit('close', { process: this })
    }

    /**
     * Handle output data from the process.
     *
     * @param rawChunk The chunk of data we're about to process.
     */
    protected onData(rawChunk: string): void {

        let chunk = rawChunk

        this.rawChunks.push(rawChunk)

        this.emit('data', {
            process: this,
            chunk
        })

        let storeChunk: boolean = true
        const lines: Array<string> = chunk.split('\n')
        if (lines.length) {

            // Look for report prefix in the first line
            // of this chunk. If found, start report mode.
            if (!this.reports && !this.reportClosed) {
                if (lines.filter(line => line.match(/\s*\{\s*/m)).length) {
                    this.reports = true

                    // Remove delimiter from chunk, in case need to we store it.
                    chunk = chunk.replace(/\s*\{\s*/m, '')
                }
            }

            if (this.reports && !this.reportClosed) {
                // Only add to buffer if it's full or partial base64 string,
                // as some reporters might occasionally output stray content.
                if ((/^[A-Za-z0-9\/\+=\(\)]+$/im).test(chunk)) {
                    this.reportBuffer += chunk
                    // Test if buffer is now a complete report and, if so, extract it
                    if ((/\((?:(?!\)).)+\)/).test(this.reportBuffer)) {
                        this.reportBuffer = this.reportBuffer.replace(/\s*({\s*)?\((?:(?!\)).)+\)\s*}?/g, (match, offset, string) => {
                            this.report(match)
                            return ''
                        })
                    }
                    storeChunk = false
                }

                if (lines.filter(line => line.match(/\s*\}\s*/m)).length) {
                    this.reportClosed = true

                    // Remove delimiter from raw chunk, in case need to we store it.
                    chunk = chunk.replace(/\s*\}\s*/m, '')
                }
            }
        }

        // If reporting hasn't overridden store directive and if there's still
        // chunk left to store, add it to our output array.
        if (storeChunk && chunk) {
            this.chunks.push(chunk)
            Logger.info.log(chunk)
        }
    }

    /**
     * Emit a test report that was extracted from the output stream.
     *
     * @param encoded The base64 encoded string that the process identified as a report.
     */
    protected report (encoded: string): void {
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
    protected parseReport (chunk: string): object | string {
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
        return this.chunks.join('\n').split('\n').map(chunk => stripAnsi(chunk))
    }

    /**
     * Get all lines received from the output stream, unprocessed
     */
    public getRawLines (): Array<string> {
        return this.chunks.join('\n').split('\n')
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
    public owns (command: string): boolean {
        return true
    }

    /**
     * The string representation of this process.
     */
    public toString (): string {
        return JSON.stringify({
            id: this.getId(),
            command: this.command,
            binary: this.binary,
            args: this.args,
            chunks: this.chunks,
            rawChunks: this.rawChunks,
            closed: this.closed,
            killed: this.killed,
            reports: this.reports,
            reportClosed: this.reportClosed,
            exitCode: this.exitCode,
            exitSignal: this.exitSignal
        })
    }
}
