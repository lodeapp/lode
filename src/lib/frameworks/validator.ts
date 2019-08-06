import * as Path from 'path'
import * as Fs from 'fs'
import { RepositoryOptions } from '@lib/frameworks/repository'
import { FrameworkOptions } from '@lib/frameworks/framework'
import { getFrameworkByType } from '@lib/frameworks'

/**
 * The required format for validation errors.
 */
export type ValidationErrors = { [index: string]: Array<string> }

/**
 * Potential repository options (i.e. not necessarily valid).
 */
export type PotentialRepositoryOptions = RepositoryOptions & {
    path?: string
}

/**
 * Potential framework options (i.e. not necessarily valid).
 */
export type PotentialFrameworkOptions = FrameworkOptions & {
    name?: string
    type?: string
    command?: string
    path?: string
    sshHost?: string
    sshUser?: string | null
    sshPort?: number | null
    sshIdentity?: string | null
}

/**
 * Available options to instantiate a framework validator.
 */
export type FrameworkValidatorOptions = {
    repositoryPath: string
}

/**
 * A generic validation class.
 */
export class Validator {

    public errors: ValidationErrors = {}

    /**
     * Validate the current instance with given data.
     *
     * @param data The data to validate.
     */
    public validate (data: object): void {
        this.reset()
    }

    /**
     * Check if a given path is a directory.
     *
     * @param path The path to check.
     */
    public isDirectory (path: string): boolean {
        try {
            return Fs.statSync(path).isDirectory()
        } catch (error) {
            if (error.code === 'ENOENT') {
                return false
            }
            throw error
        }
    }

    /**
     * Check if a given path is a file.
     *
     * @param path The path to check.
     */
    public isFile (path: string): boolean {
        try {
            return Fs.statSync(path).isFile()
        } catch (error) {
            if (error.code === 'ENOENT') {
                return false
            }
            throw error
        }
    }

    /**
     * Whether the current instance is valid.
     */
    public isValid (): boolean {
        return this.hasErrors()
    }

    /**
     * Reset errors in the current instance.
     */
    public reset (fields?: Array<string>): void {
        Object.keys(this.errors).forEach(key => {
            if (!fields || fields.includes(key)) {
                this.errors[key] = []
            }
        })
    }

    /**
     * Whether the current instance has any errors for the given key.
     *
     * @param key The key to check for errors.
     */
    public hasErrors (key?: string): boolean {
        if (typeof key === 'undefined') {
            let hasErrors = true
            Object.keys(this.errors).forEach(key => {
                if (this.errors[key].length > 0) {
                    hasErrors = false
                }
            })
            return hasErrors
        }

        return this.errors[key] && this.errors[key].length > 0
    }

    /**
     * Get errors for the given key.
     *
     * @param key The key to get errors from.
     */
    public getErrors (key: string): string {
        if (!this.hasErrors(key)) {
            return ''
        }

        return this.errors[key].join('; ')
    }

    /**
     * Whether the current instance has any errors for the given key.
     *
     * @param path The error key.
     * @param path The error message to add.
     */
    public addError (key: string, message: string): void {
        if (typeof this.errors[key] === 'undefined') {
            this.errors[key] = []
        }

        this.errors[key].push(message)
    }
}

/**
 * A validation class for repository objects.
 */
export class RepositoryValidator extends Validator {

    protected existing: Array<string>

    constructor (existing: Array<string>) {
        super()
        this.existing = existing
        this.errors = {
            path: []
        }
    }

    /**
     * Validate a set of repository options.
     *
     * @param options The repository options to validate.
     */
    public validate (options: PotentialRepositoryOptions): this {
        super.validate(options)

        if (!options.path) {
            this.addError('path', 'Please enter a repository path.')
        } else if (!this.isDirectory(options.path)) {
            this.addError('path', 'Please enter a valid repository directory.')
        } else if (this.existing.includes(options.path)) {
            this.addError('path', 'The project already contains this repository.')
        }

        return this
    }
}

/**
 * A validation class for framework objects.
 */
export class FrameworkValidator extends Validator {
    public readonly repositoryPath: string

    constructor (options: FrameworkValidatorOptions) {
        super()
        this.errors = {
            name: [],
            type: [],
            command: [],
            path: [],
            sshHost: [],
            sshUser: [],
            sshPort: [],
            sshIdentity: []
        }
        this.repositoryPath = options.repositoryPath
    }

    /**
     * Validate a set of framework options.
     *
     * @param options The framework options to validate.
     */
    public validate (options: PotentialFrameworkOptions): this {
        super.validate(options)

        if (!options.name) {
            this.addError('name', 'Please enter a framework name.')
        }

        if (!options.type) {
            this.addError('type', 'Please select a framework type.')
        } else if (!getFrameworkByType(options.type)) {
            this.addError('type', 'Framework type "' + options.type  + '" is invalid.')
        }

        if (!options.command) {
            this.addError('command', 'Please enter a framework command.')
        }

        if (options.path) {
            if (Path.isAbsolute(options.path)) {
                this.addError('path', 'Please enter a path relative to the repository directory.')
            } else if (!this.isDirectory(Path.join(this.repositoryPath, options.path))) {
                this.addError('path', 'Please enter a valid directory relative to the repository directory.')
            }
        }

        if (options.sshPort) {
            if (!String(options.sshPort).match(/^([0-9]{1,4}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])$/)) {
                this.addError('sshPort', 'Please enter a valid port number.')
            }
        }

        const framework = getFrameworkByType(options.type)
        if (framework) {
            framework.validate(this, options)
        }

        return this
    }
}
