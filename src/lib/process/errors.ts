import { IProcess } from './process'

export interface ErrorWithCode extends Error {
    code?: string | number
}

export class ProcessError extends Error implements ErrorWithCode {
    process?: IProcess
    code?: string | number | undefined

    constructor (...args: Array<string>) {
        super(...args)
    }

    public setProcess (process: IProcess): this {
        this.process = process
        return this
    }

    public setCode (code?: string | number): this {
        this.code = code
        return this
    }

    public toString (): string {
        return this.message
    }
}
