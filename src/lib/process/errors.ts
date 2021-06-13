import { IProcess } from '@lib/process/process'

/**
 * An error with a code number property.
 */
export interface ErrorWithCode extends Error {
    code?: string | number | null
}

/**
 * An error thrown by our standard process.
 */
export class ProcessError extends Error implements ErrorWithCode {
    process?: string
    code?: string | number | null | undefined

    /**
     * Set the process that originated the error.
     *
     * @param process The process to set to.
     */
    public setProcess (process: IProcess): this {
        this.process = process.toString()
        return this
    }

    /**
     * Get the process that originated the error as a plain
     * object, parsed from its string representation.
     *
     * @param process The process to set to.
     */
    public getProcess (): object | undefined {
        return this.process ? JSON.parse(this.process) : undefined
    }

    /**
     * The error code.
     *
     * @param code The error code we're setting.
     */
    public setCode (code?: string | number | null): this {
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
