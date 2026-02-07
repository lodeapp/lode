import { FrameworkValidator, RepositoryValidator, Validator } from '@lib/frameworks/validator'

vi.mock('node:fs', () => ({
    statSync: vi.fn(),
}))

vi.mock('@lib/frameworks', () => ({
    getFrameworkByType: vi.fn(),
}))

vi.mock('is-unc-path', () => ({
    default: vi.fn(path => path.startsWith('\\\\')),
}))

const Fs = await import('node:fs')
const { getFrameworkByType } = await import('@lib/frameworks')

describe('validator base class', () => {
    it('starts with no errors and is valid', () => {
        const v = new Validator()
        expect(v.isValid()).toBe(true)
        expect(v.getErrors()).toEqual({})
    })

    it('can add and retrieve errors', () => {
        const v = new Validator()
        v.addError('field', 'Something went wrong')
        expect(v.hasErrors('field')).toBe(true)
        expect(v.getErrors('field')).toEqual(['Something went wrong'])
    })

    it('can add multiple errors to the same key', () => {
        const v = new Validator()
        v.addError('field', 'Error 1')
        v.addError('field', 'Error 2')
        expect(v.getErrors('field')).toEqual(['Error 1', 'Error 2'])
    })

    it('returns null for a key with no errors', () => {
        const v = new Validator()
        expect(v.hasErrors('nonexistent')).toBeFalsy()
        expect(v.getErrors('nonexistent')).toBeNull()
    })

    it('reports as invalid when errors exist', () => {
        const v = new Validator()
        v.addError('field', 'Error')
        expect(v.isValid()).toBe(false)
    })

    it('resets all errors', () => {
        const v = new Validator()
        v.addError('a', 'Error A')
        v.addError('b', 'Error B')
        v.reset()
        expect(v.hasErrors('a')).toBe(false)
        expect(v.hasErrors('b')).toBe(false)
    })

    it('resets errors for specific fields only', () => {
        const v = new Validator()
        v.addError('a', 'Error A')
        v.addError('b', 'Error B')
        v.reset(['a'])
        expect(v.hasErrors('a')).toBe(false)
        expect(v.hasErrors('b')).toBe(true)
    })

    it('returns false for isDirectory when path does not exist', () => {
        Fs.statSync.mockImplementation(() => {
            const err = new Error('ENOENT')
            err.code = 'ENOENT'
            throw err
        })
        const v = new Validator()
        expect(v.isDirectory('/nonexistent')).toBe(false)
    })

    it('returns true for isDirectory when path is a directory', () => {
        Fs.statSync.mockReturnValue({ isDirectory: () => true })
        const v = new Validator()
        expect(v.isDirectory('/exists')).toBe(true)
    })

    it('returns false for isFile when path does not exist', () => {
        Fs.statSync.mockImplementation(() => {
            const err = new Error('ENOENT')
            err.code = 'ENOENT'
            throw err
        })
        const v = new Validator()
        expect(v.isFile('/nonexistent')).toBe(false)
    })

    it('returns true for isFile when path is a file', () => {
        Fs.statSync.mockReturnValue({ isFile: () => true })
        const v = new Validator()
        expect(v.isFile('/exists')).toBe(true)
    })

    it('rethrows non-ENOENT errors from isDirectory', () => {
        Fs.statSync.mockImplementation(() => {
            const err = new Error('EACCES')
            err.code = 'EACCES'
            throw err
        })
        const v = new Validator()
        expect(() => v.isDirectory('/forbidden')).toThrow('EACCES')
    })
})

describe('repositoryValidator', () => {
    beforeEach(() => {
        Fs.statSync.mockReturnValue({ isDirectory: () => true })
    })

    it('requires a path', () => {
        const v = new RepositoryValidator([])
        v.validate({ path: '' })
        expect(v.hasErrors('path')).toBe(true)
        expect(v.getErrors('path')).toEqual(['Please enter a repository path.'])
    })

    it('rejects non-existent directories', () => {
        Fs.statSync.mockImplementation(() => {
            const err = new Error('ENOENT')
            err.code = 'ENOENT'
            throw err
        })
        const v = new RepositoryValidator([])
        v.validate({ path: '/nonexistent' })
        expect(v.hasErrors('path')).toBe(true)
        expect(v.getErrors('path')).toEqual(['Please enter a valid repository directory.'])
    })

    it('rejects duplicate paths', () => {
        const v = new RepositoryValidator(['/existing/repo'])
        v.validate({ path: '/existing/repo' })
        expect(v.hasErrors('path')).toBe(true)
        expect(v.getErrors('path')).toEqual(['The project already contains this repository.'])
    })

    it('accepts a valid unique directory path', () => {
        const v = new RepositoryValidator([])
        v.validate({ path: '/valid/path' })
        expect(v.isValid()).toBe(true)
    })

    it('resets errors between validations', () => {
        const v = new RepositoryValidator([])
        v.validate({ path: '' })
        expect(v.hasErrors('path')).toBe(true)
        v.validate({ path: '/valid/path' })
        expect(v.isValid()).toBe(true)
    })
})

describe('frameworkValidator', () => {
    beforeEach(() => {
        Fs.statSync.mockReturnValue({ isDirectory: () => true })
        getFrameworkByType.mockReturnValue({ validate: vi.fn() })
    })

    it('requires a name', () => {
        const v = new FrameworkValidator('/repo')
        v.validate({ name: '', type: 'jest', command: 'npx jest' })
        expect(v.hasErrors('name')).toBe(true)
        expect(v.getErrors('name')).toEqual(['Please enter a framework name.'])
    })

    it('requires a type', () => {
        const v = new FrameworkValidator('/repo')
        v.validate({ name: 'Tests', type: '', command: 'npx jest' })
        expect(v.hasErrors('type')).toBe(true)
        expect(v.getErrors('type')).toEqual(['Please select a framework type.'])
    })

    it('rejects an invalid framework type', () => {
        getFrameworkByType.mockReturnValue(undefined)
        const v = new FrameworkValidator('/repo')
        v.validate({ name: 'Tests', type: 'nonexistent', command: 'npm test' })
        expect(v.hasErrors('type')).toBe(true)
        expect(v.getErrors('type')).toEqual(['Framework type "nonexistent" is invalid.'])
    })

    it('requires a command', () => {
        const v = new FrameworkValidator('/repo')
        v.validate({ name: 'Tests', type: 'jest', command: '' })
        expect(v.hasErrors('command')).toBe(true)
        expect(v.getErrors('command')).toEqual(['Please enter a framework command.'])
    })

    it('rejects absolute paths', () => {
        const v = new FrameworkValidator('/repo')
        v.validate({ name: 'Tests', type: 'jest', command: 'npx jest', path: '/absolute/path' })
        expect(v.hasErrors('path')).toBe(true)
        expect(v.getErrors('path')).toEqual(['Please enter a path relative to the repository directory.'])
    })

    it('rejects a relative path that does not exist as a directory', () => {
        Fs.statSync.mockImplementation(() => {
            const err = new Error('ENOENT')
            err.code = 'ENOENT'
            throw err
        })
        const v = new FrameworkValidator('/repo')
        v.validate({ name: 'Tests', type: 'jest', command: 'npx jest', path: 'subdir' })
        expect(v.hasErrors('path')).toBe(true)
        expect(v.getErrors('path')).toEqual(['Please enter a valid directory relative to the repository directory.'])
    })

    it('accepts a valid relative path', () => {
        const v = new FrameworkValidator('/repo')
        v.validate({ name: 'Tests', type: 'jest', command: 'npx jest', path: 'src' })
        expect(v.hasErrors('path')).toBe(false)
    })

    it('validates SSH port format', () => {
        const v = new FrameworkValidator('/repo')
        v.validate({ name: 'Tests', type: 'jest', command: 'npx jest', sshPort: 99999 })
        expect(v.hasErrors('sshPort')).toBe(true)
        expect(v.getErrors('sshPort')).toEqual(['Please enter a valid port number.'])
    })

    it('accepts valid SSH port numbers', () => {
        const v = new FrameworkValidator('/repo')
        v.validate({ name: 'Tests', type: 'jest', command: 'npx jest', sshPort: 22 })
        expect(v.hasErrors('sshPort')).toBe(false)
    })

    it('accepts port number at upper boundary (65535)', () => {
        const v = new FrameworkValidator('/repo')
        v.validate({ name: 'Tests', type: 'jest', command: 'npx jest', sshPort: 65535 })
        expect(v.hasErrors('sshPort')).toBe(false)
    })

    it('calls framework-specific validate when type is valid', () => {
        const frameworkValidate = vi.fn()
        getFrameworkByType.mockReturnValue({ validate: frameworkValidate })
        const v = new FrameworkValidator('/repo')
        const options = { name: 'Tests', type: 'jest', command: 'npx jest' }
        v.validate(options)
        expect(frameworkValidate).toHaveBeenCalledWith(v, options)
    })

    it('accepts a fully valid framework configuration', () => {
        const v = new FrameworkValidator('/repo')
        v.validate({ name: 'Tests', type: 'jest', command: 'npx jest' })
        expect(v.isValid()).toBe(true)
    })
})
