import * as Path from 'path'
import * as Fs from 'fs-extra'
import { Console } from './console'
import { IProcess } from '../process/process'

export class Debug extends Console {
    protected error: null | string | Error = null
    protected process: null | IProcess = null

    public withError (error: null | string | Error): this {
        this.error = error
        return this
    }

    public withProcess (process: null | IProcess): this {
        this.process = process
        return this
    }

    public save (directory: string) {
        const file = Path.join(directory, 'log-' + Math.floor(new Date().getTime() / 1000) + '.json')

        if (Fs.existsSync(file)) {
            throw new Error(`Process log already exists in ${directory}`)
        }

        const log = {
            error: this.error ? (this.error instanceof Error ? this.error.toString() : this.error) : null,
            process: this.process ? JSON.parse(this.process.toString()) : null,
            env: Object.keys(process.env)
        }

        Fs.writeFileSync(file, JSON.stringify(log, null, 4))
    }

    protected commit (method: string, ...data: Array<any>): void {

        if (!__DEV__) {
            return
        }

        super.commit(method, ...data)
    }
}
