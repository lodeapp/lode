import { getFrameworkByType, Jest, PHPUnit, PHPUnit10 } from '@lib/frameworks'
import { FrameworkFactory } from '@lib/frameworks/factory'
import { ApplicationWindow } from '@main/application-window'

vi.mock('@lib/state')
vi.mock('electron-store')
vi.mock('@main/application-window')

it('can make a new framework', async () => {
    const window = new ApplicationWindow()
    const options = {
        id: '42',
        type: 'phpunit',
    }

    const framework = FrameworkFactory.make(window, options)
    expect(framework).toBeInstanceOf(PHPUnit)
    // Persists id
    expect(framework.id).toBe('42')
    // Hydrates with default options, including proprietary and OS-specific
    expect(framework.name).toBe('PHPUnit (Legacy)')
    expect(framework.proprietary).toEqual({
        autoloadPath: '',
    })
    expect(framework.command).toBe(
        __WIN32__
            ? 'php vendor/phpunit/phpunit/phpunit'
            : './vendor/bin/phpunit',
    )
})

it('fails if type does not exist', async () => {
    const window = new ApplicationWindow()
    const options = {
        type: 'biscuit',
    }

    expect(() => {
        FrameworkFactory.make(window, options)
    }).toThrow('Unknown framework type "biscuit"')
})

it('can make a Jest framework', async () => {
    const window = new ApplicationWindow()
    const options = {
        id: '43',
        type: 'jest',
    }

    const framework = FrameworkFactory.make(window, options)
    expect(framework).toBeInstanceOf(Jest)
    expect(framework.id).toBe('43')
    expect(framework.name).toBe('Jest')
    expect(framework.type).toBe('jest')
})

it('can make a PHPUnit 10+ framework', async () => {
    const window = new ApplicationWindow()
    const options = {
        id: '44',
        type: 'phpunit-10',
    }

    const framework = FrameworkFactory.make(window, options)
    expect(framework).toBeInstanceOf(PHPUnit10)
    expect(framework.id).toBe('44')
    expect(framework.name).toBe('PHPUnit')
})

it('can find framework classes by type', () => {
    expect(getFrameworkByType('jest')).toBe(Jest)
    expect(getFrameworkByType('phpunit')).toBe(PHPUnit)
    expect(getFrameworkByType('phpunit-10')).toBe(PHPUnit10)
})

it('returns undefined for unknown framework types', () => {
    expect(getFrameworkByType('biscuit')).toBeUndefined()
    expect(getFrameworkByType('')).toBeUndefined()
})

it('preserves provided id and merges with defaults', async () => {
    const window = new ApplicationWindow()
    const framework = FrameworkFactory.make(window, {
        id: 'my-id',
        type: 'jest',
        name: 'Custom Name',
    })
    expect(framework.id).toBe('my-id')
    expect(framework.name).toBe('Custom Name')
})
