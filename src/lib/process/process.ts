import stripAnsi from 'strip-ansi'
import { EventEmitter } from 'events'
import { compact, flattenDeep } from 'lodash'
import { spawn, ChildProcess } from 'child_process'
import { ErrorWithCode } from './errors'

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
    process: ChildProcess

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

        console.log('executing', this.spawnPath, this.args, this.path)
        const spawnedProcess = spawn(this.spawnPath, this.args || [], {
            cwd: this.path,
            env: Object.assign({}, process.env, {
                // Ensure ANSI color is supported
                FORCE_COLOR: 1
            })
        })

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
        console.log('error', err)
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
        console.log('closing', code, signal)
        // If exit code was non-zero but we were running a report
        // that finished successfully, we should ignore the error,
        // assuming it relates to a failure in the tests for which
        // we'll give appropriate feedback on in the interface.
        if (code === 0 || (this.reports && this.reportClosed)) {
            this.emit('success', { process: this })
        } else if (this.process && this.process.killed || this.killed) {
            this.emit('killed', { process: this })
        } else {
            // If process errored out, but did not emit an error
            // event, we'll compose it from the chunks we received.
            if (!this.error) {
                this.error = this.rawChunks.join('')
            }
            this.emit('error', {
                process: this,
                message: this.error,
                code
            })
        }
    }

    private onData(chunk: string): void {

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
                const firstLine = filteredLines.shift()
                if (firstLine === '{') {
                    this.reports = true
                }
            }

            const filteredChunk = filteredLines.join('\n')
            this.chunks.push(filteredChunk)
            this.emit('data', {
                process: this,
                chunk
            })

            if (this.reports) {
                let report: string | object = ''
                const reportStarts: boolean = (/^{?\(/).test(filteredChunk)
                const reportEnds: boolean = (/\)}?$/).test(filteredChunk)
                if (reportStarts && reportEnds) {
                    report = this.parseReport(filteredChunk)
                    this.emit('report', {
                        process: this,
                        report
                    })
                } else if (reportStarts || this.reportBuffer) {
                    this.reportBuffer += filteredChunk
                    if ((/\((?:(?!\)).)+\)/).test(this.reportBuffer)) {
                        this.reportBuffer = this.reportBuffer.replace(/({\s?)?\((?:(?!\)).)+\)\s?}?/, (match, offset, string) => {
                            report = this.parseReport(match)
                            this.emit('report', {
                                process: this,
                                report
                            })
                            return ''
                        })
                    }
                }

                const lastLine = filteredLines.pop()
                if (lastLine === '}') {
                    this.reportClosed = true
                }
            }
        }

        // Emit data without parsing
        this.emit('rawData', {
            process: this,
            chunk
        })
    }

    private parseReport (chunk: string): object | string {
        chunk = Buffer.from(chunk.match(/\((.+)\)/)![1], 'base64').toString('utf8')
        try {
            return JSON.parse(chunk)
        } catch (SyntaxError) {
            return chunk
        }
    }

    public getLines (): Array<string> {
        return this.chunks.join('').split('\n')
    }

    public getRawLines (): Array<string> {
        return this.rawChunks.join('').split('\n')
    }

    public stop (): void {
        this.process.kill()
        this.killed = true
    }

    owns (command: string): boolean {
        return true
    }
}
