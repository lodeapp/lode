import { IProcess } from '@lib/process/process'

/**
 * An error with a code number property.
 */
export interface ErrorWithCode extends Error {
    code?: string | number
}

/**
 * An error thrown by our standard process.
 */
export class ProcessError extends Error implements ErrorWithCode {
    process?: IProcess
    code?: string | number | undefined

    constructor (...args: Array<string>) {
        super(...args)
    }

    /**
     * Set the process that originated the error.
     *
     * @param process The process to set to.
     */
    public setProcess (process: IProcess): this {
        this.process = process
        return this
    }

    /**
     * The error code.
     *
     * @param code The error code we're setting.
     */
    public setCode (code?: string | number): this {
        this.code = code
        return this
    }

    /**
     * Transform this error to a string.
     */
    public toString (): string {
        return this.message
    }
}
