import * as fs from 'fs'
import * as Path from 'path'
import { RepositoryOptions } from '@lib/frameworks/repository'
import { FrameworkOptions } from '@lib/frameworks/framework'
import { Frameworks } from '@lib/frameworks'

export type ValidationErrors = { [index: string]: Array<string> }

export type PotentialRepositoryOptions = RepositoryOptions & {
    path?: string
}

export type PotentialFrameworkOptions = FrameworkOptions & {
    name?: string
    type?: string
    command?: string
    path?: string
}

export type FrameworkValidatorOptions = {
    repositoryPath: string
}

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
            return fs.statSync(path).isDirectory()
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
    public reset (): void {
        Object.keys(this.errors).forEach(key => {
            this.errors[key] = []
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
    protected addError (key: string, message: string): void {
        if (typeof this.errors[key] === 'undefined') {
            this.errors[key] = []
        }

        this.errors[key].push(message)
    }
}

export class RepositoryValidator extends Validator {

    constructor () {
        super()
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
        }

        return this
    }
}

export class FrameworkValidator extends Validator {
    readonly repositoryPath: string

    constructor (options: FrameworkValidatorOptions) {
        super()
        this.errors = {
            name: [],
            type: [],
            command: [],
            path: []
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
        } else if (Frameworks.map(framework => framework.defaults.type).indexOf(options.type) === -1) {
            this.addError('type', 'Framework type "' + options.type  + '" is invalid.')
        }

        if (!options.command) {
            this.addError('command', 'Please enter a framework command.')
        }

        if (options.path) {
            if (Path.isAbsolute(options.path)) {
                this.addError('path', 'Please enter a path relative to the repository directory.')
            } else if (!this.isDirectory(Path.join(this.repositoryPath, options.path))) {
                this.addError('path', 'Please enter a valid directory.')
            }
        }

        return this
    }
}
