import stripAnsi from 'strip-ansi'
import { EventEmitter } from 'events'
import * as Path from 'path'
import * as fs from 'fs-extra'
import { compact, flattenDeep } from 'lodash'
import { spawn, ChildProcess } from 'child_process'
import { Logger } from '@lib/logger'
import { ErrorWithCode } from '@lib/process/errors'

export interface IProcess extends EventEmitter {
    readonly process?: ChildProcess
    stop (): void
    owns (command: string): boolean
}

export class DefaultProcess extends EventEmitter implements IProcess {
    command: string
    spawnPath: string
    args: Array<string>
    path?: string
    pristine: boolean
    chunks: Array<string>
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
       args: Array<string>,
       path: string
    ) {
        super()

        // Remember raw command and path for user feedback
        this.command = command
        this.path = path

        // Set process control defaults
        this.pristine = true
        this.chunks = []
        this.rawChunks = []
        this.error = ''
        this.killed = false
        this.reports = false
        this.reportBuffer = ''
        this.reportClosed = false

        // Parse command and arguments into something we
        // can use for spawning a process.
        this.args = compact(
            flattenDeep([command].concat(args).map((arg: string) => {
                return arg.split(' ')
            }))
        )
        this.spawnPath = this.args.shift()!

        // We can re-process stored streams with the `fromFile` property,
        // being that of a JSON file stored in the debug folder (i.e. previously
        // recorded using the `writeToFile` property).
        if (this.fromFile) {
            process.nextTick(() => {
                Logger.debug.log(`Re-running process from file ${this.fromFile}.json`)
                const file = Path.join(__dirname, `./debug/${this.fromFile}.json`)
                if (!fs.existsSync(file)) {
                    Logger.debug.log(`File ${this.fromFile}.json does not exist in the debug folder`)
                }
                const stored = fs.readJsonSync(file, { throws: false }) || []
                stored.forEach((chunk: string) => {
                    this.onData(chunk)
                })
                this.onClose(0, null)
            }, 0)
            return
        }

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
        this.ignoreClosedInputStream(spawnedProcess)
        this.addListeners(spawnedProcess)

        this.process = spawnedProcess
    }

    // https://github.com/desktop/dugite/blob/b30c78cd41d53052357412993b857779ec8aaa5f/lib/git-process.ts#L282
    private ignoreClosedInputStream (process: ChildProcess) {
        process.stdin.on('error', err => {
            const code = (err as ErrorWithCode).code

            if (code === 'EPIPE' || code === 'EOF' || code === 'ECONNRESET') {
              return
            }

            if (process.stdin.listeners('error').length <= 1) {
              throw err
            }
        })
    }

    private addListeners (process: ChildProcess) {
        process.on('close', (...args) => this.onClose(...args))
        process.on('error', (err) => this.onError(err as ErrorWithCode))
        process.stdout.on('data', (...args) => this.onData(...args))
        process.stderr.on('data', (...args) => this.onData(...args))
    }

    public filterLines (lines: Array<string>): Array<string> {
        return lines
    }

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
            // If process errored out, but did not emit an error
            // event, we'll compose it from the chunks we received.
            if (!this.error) {
                console.log(this.rawChunks)
                this.error = this.rawChunks.join('\n')
            }

            Logger.debug.log('Process errored without throwing.', { error: this.error })

            this.emit('error', {
                process: this,
                message: this.error,
                code
            })
        }

        Logger.info.groupEnd()
    }

    private onData(chunk: string): void {

        // When debugging a stream, we can write all chunks
        // to a file then repeat them as needed.
        if (!this.fromFile && this.writeToFile) {
            const file = Path.join(__dirname, `./debug/${this.process!.pid}.json`)
            if (!fs.existsSync(file)) {
                fs.writeFileSync(file, JSON.stringify([], null, 4))
            }
            const stored = fs.readJsonSync(file, { throws: false }) || []
            stored.push(chunk)
            fs.writeFileSync(file, JSON.stringify(stored, null, 4))
        }

        // Ignore chunks made of only ANSI codes or escape characters
        chunk = stripAnsi(chunk)
        if (!chunk.replace(/\x1b/gi, '')) {
            return
        }

        const lines = chunk.split('\n')

        // Process chunk to make output easier to consume,
        // depending on the runner. If all content is
        // filtered out, we won't emit the event.
        const filteredLines = this.filterLines(compact(lines))

        // Update raw output
        this.rawChunks.push(chunk)

        if (filteredLines.length) {

            // Look for report prefix in the first line
            // of this chunk. If found, start report mode.
            if (!this.reports && !this.reportClosed) {
                if (filteredLines.includes('{')) {
                    this.reports = true
                }
            }

            const filteredChunk = filteredLines.join('\n')
            this.chunks.push(filteredChunk)
            this.emit('data', {
                process: this,
                chunk
            })

            if (this.reports && !this.reportClosed) {
                // Only add to buffer if it's full or partial base64 string,
                // as some reporters might occasionally output stray content.
                if ((/^[A-Za-z0-9\/\+=\(\)]+$/im).test(filteredChunk)) {
                    this.reportBuffer += filteredChunk
                    if ((/\((?:(?!\)).)+\)/).test(this.reportBuffer)) {
                        this.reportBuffer = this.reportBuffer.replace(/({\s?)?\((?:(?!\)).)+\)\s?}?/g, (match, offset, string) => {
                            this.report(match)
                            return ''
                        })
                    }
                }

                if (filteredLines.includes('}')) {
                    this.reportClosed = true
                }
            } else {
                Logger.info.log(chunk)
            }
        }

        // Emit data without parsing
        this.emit('rawData', {
            process: this,
            chunk
        })
    }

    private report (encoded: string): void {
        const report = this.parseReport(encoded)
        this.emit('report', {
            process: this,
            report
        })
        Logger.info.log('[encoded]')
        Logger.debug.dir(report)
    }

    private parseReport (chunk: string): object | string {
        chunk = Buffer.from(chunk.match(/\((.+)\)/)![1], 'base64').toString('utf8')
        try {
            return JSON.parse(chunk)
        } catch (SyntaxError) {
            Logger.info.log('Failed to decode report.')
            return chunk
        }
    }

    public getLines (): Array<string> {
        return this.chunks.join('\n').split('\n')
    }

    public getRawLines (): Array<string> {
        return this.rawChunks.join('\n').split('\n')
    }

    public stop (): void {
        process.kill(-this.process!.pid);
        this.killed = true
    }

    owns (command: string): boolean {
        return true
    }
}
