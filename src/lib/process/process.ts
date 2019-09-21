import stripAnsi from 'strip-ansi'
import { EventEmitter } from 'events'
import * as Path from 'path'
import * as Fs from 'fs-extra'
import { compact, flattenDeep, get } from 'lodash'
import { spawn, ChildProcess } from 'child_process'
import { SSHOptions, SSH } from './ssh'
import { BufferedSearch } from './search'
import { ErrorWithCode, ProcessError } from './errors'

export type ProcessId = string | number

export type ProcessOptions = {
    command: string
    args: Array<string>
    path: string
    forceRunner?: string | null
    ssh?: boolean
    sshOptions?: SSHOptions
}

export interface IProcess extends EventEmitter {
    getId (): ProcessId
    stop (): void
    owns (command: string): boolean
}

export class DefaultProcess extends EventEmitter implements IProcess {
    static readonly type: string = 'default'
    protected readonly startDelimiter: string = '<<<REPORT{'
    protected readonly endDelimiter: string = '}REPORT>>>'
    protected search: BufferedSearch
    protected command!: string
    protected binary: string = ''
    protected args: Array<string> = []
    protected path?: string
    protected chunks: Array<string> = []
    protected rawChunks: Array<string> = []
    protected error: string = ''
    protected killed: boolean = false
    protected closed: boolean = false
    protected exitCode?: number
    protected exitSignal: string | null = null
    protected reports: boolean = false
    protected reportBuffer: string = ''
    protected reportClosed: boolean = false
    protected writeToFile: boolean = false
    protected process?: ChildProcess

    constructor (options: ProcessOptions) {
        super()

        // Create a new multi-line search object to parse delimiters
        this.search = new BufferedSearch()

        // We can re-process stored streams by running `FROM_FILE=${file} yarn dev`.
        // If set, all processes will output chunks from the stored file.
        if (__DEV__ && process.env.FROM_FILE) {
            process.nextTick(() => {
                const file = Path.isAbsolute(process.env.FROM_FILE!)
                    ? process.env.FROM_FILE!
                    : Path.join(__dirname, `./debug/${process.env.FROM_FILE}.json`)

                log.debug(`Re-running process from file ${file}.`)

                if (!Fs.existsSync(file)) {
                    log.debug(`File ${file} does not exist.`)
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

        // Parse command and arguments into something we can use for spawning a
        // process. This means extracting the actual binary from a command that
        // could include both binary and default arguments (e.g. `yarn test`
        // refers to the `yarn` binary with a `test` argument).
        //
        // @TODO: This will break if the command is a binary whose filename has
        // spaces in it. Although it's an edge case (hopefully), we are taking
        // a leap of faith with the space-split and we should handle it better
        // in the future (i.e. don't split if in quotes or something).
        this.args = this.spawnArguments(
            compact(
                flattenDeep(((this.command as any).split(' ')).concat(options.args!))
            ) || []
        )

        if (options.ssh) {
            this.binary = 'ssh'
            this.args = (new SSH(options.sshOptions)).commandArgs(this.args)
        } else {
            this.binary = this.args.shift()!
        }

        log.debug(['Spawning child process', JSON.stringify({ spawn: this.binary, args: this.args, path: this.path })].join(' '))
        log.info(`Executing command: ${this.binary} ${this.args.join(' ')}`)

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
    public getId (): ProcessId {
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

        log.debug('Process error', err)

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

        log.debug(['Process closing.', JSON.stringify({ code, signal })].join(' '))

        if (this.process && this.process.killed || this.killed) {
            log.debug('Process killed.')
            this.emit('killed', { process: this })
        } else if (code === 0 || (this.reports && this.reportClosed)) {
            // If exit code was non-zero but we were running a report that finished
            // successfully, ignore the error, assuming it relates to a failure in the
            // tests for which we'll give appropriate feedback in the interface.
            log.debug('Process successfully exited.')
            this.emit('success', {
                process: this,
                lines: this.getLines(),
                rawLines: this.getRawLines(),
            })
        } else {
            // If process errored out but did not emit an error event, we'll
            // compose it from the chunks we received.
            if (!this.error) {
                if (this.reportBuffer) {
                    this.chunks.push(this.reportBuffer)
                }
                this.error = this.chunks.join('')
            }

            const error = (new ProcessError(this.error))
                .setProcess(this)
                .setCode(code)

            log.error('Process errored without throwing.', error)
            this.emit('error', error)
        }

        if (this.writeToFile) {
            Fs.writeFileSync(
                Path.join(Path.join(__dirname, 'debug'), 'log-' + Math.floor(new Date().getTime() / 1000) + '.json'),
                JSON.stringify({
                    error: this.error.toString(),
                    process: this.toString(),
                    env: Object.keys(process.env)
                }, null, 4)
            )
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

        if (!this.reports && !this.reportClosed) {
            // Look for start delimiter. If found, start report mode.
            this.reports = this.search.term(this.startDelimiter, chunk)
        }

        if (this.reports && !this.reportClosed) {
            // Only add to buffer if it's full or partial base64 string, as some reporters
            // might occasionally output stray content. We're not testing for well-formed
            // base64 strings at this point, because they could've been truncated.
            if ((/^[A-Za-z0-9\/\+=\(\)]+$/im).test(chunk)) {
                this.reportBuffer += chunk
                // Test if buffer is now a complete report and, if so, extract it
                if ((/\((?:(?!\)).)+\)/).test(this.reportBuffer)) {
                    this.reportBuffer = this.reportBuffer.replace(/\s*({\s*)?\((?:(?!\)).)+\)\s*}?/g, (match, offset, string) => {
                        let report
                        try {
                            // Attempt to parse the match into a report. If parsing fails,
                            // return the match so that it stays part of the buffer, assuming
                            // it's not a proper base64 string and it should be added to the
                            // remaining output at the end of the process.
                            report = JSON.parse(Buffer.from(match.match(/\((.+)\)/)![1], 'base64').toString('utf8'))
                        } catch (SyntaxError) {
                            log.warn(`Error parsing report match: ${match}.`)
                            this.chunks.push(chunk)
                            return ''
                        }

                        // Only emit properly parsed reports.
                        this.emit('report', { report })

                        if (__DEV__) {
                            console.log(report)
                        }

                        // If reporting succeeded, remove it from buffer.
                        return ''
                    })
                }
                storeChunk = false
            }

            // Look for end delimiter. If found, close report.
            this.reportClosed = this.search.term(this.endDelimiter, chunk)
        }

        // If reporting hasn't overridden store directive and if there's still
        // chunk left to store, add it to our output array.
        if (storeChunk && chunk) {
            this.chunks.push(chunk)
            log.debug(chunk)
        }
    }

    /**
     * Get all lines received from the output stream, clear of Ansi escape codes.
     */
    protected getLines (): Array<string> {
        return this.chunks.join('\n').split('\n').map(chunk => stripAnsi(chunk))
    }

    /**
     * Get all lines received from the output stream, unprocessed
     */
    protected getRawLines (): Array<string> {
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
